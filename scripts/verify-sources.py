#!/usr/bin/env python3
"""Check cited pages and literal quotations. This is not automated fact-checking.

Uses only Python's standard library. TLS verification remains enabled.
Full downloaded documents stay in the chosen local cache; the repository keeps
only a small verification report with URLs, timestamps, hashes and outcomes.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[1]

class ReadableText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ignored = []
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'sup'):
            self.ignored.append(tag)

    def handle_endtag(self, tag):
        if self.ignored and tag == self.ignored[-1]:
            self.ignored.pop()

    def handle_data(self, data):
        if not self.ignored:
            self.parts.append(data.strip())

    def text(self):
        return normalize(' '.join(self.parts))

def normalize(text):
    return re.sub(r'\s+', ' ', text).strip()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', default='/tmp/minuit-verified-sources')
    parser.add_argument('--report', default=str(ROOT / 'docs/source-verification.json'))
    args = parser.parse_args()
    cache = Path(args.cache)
    cache.mkdir(parents=True, exist_ok=True)
    questions = json.loads((ROOT / 'src/questions.json').read_text())
    groups = {}
    for q in questions:
        for source in q['sources']:
            group = groups.setdefault(source['url'], {'questions': [], 'quotes': []})
            group['questions'].append(q['id'])
            group['quotes'].extend(source['quotes'])

    def check(item):
        url, data = item
        result = {'url': url, 'questions': sorted(set(data['questions'])),
                  'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat()}
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'MinuitQuizSourceReview/1.0 (educational reference verification)'})
            with urllib.request.urlopen(req, timeout=45) as response:
                raw = response.read()
                result.update(status=response.status, finalUrl=response.url)
            key = hashlib.sha256(url.encode()).hexdigest()[:16]
            (cache / (key + '.html')).write_bytes(raw)
            text = ReadableText()
            text.feed(raw.decode('utf-8'))
            extracted = text.text()
            quotes = list(dict.fromkeys(data['quotes']))
            result['sha256'] = hashlib.sha256(raw).hexdigest()
            result['checkedQuotes'] = len(quotes)
            result['missingQuotes'] = [quote for quote in quotes if normalize(quote) not in extracted]
            result['passed'] = result['status'] == 200 and not result['missingQuotes']
        except Exception as error:
            result.update(passed=False, error=str(error))
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(check, groups.items()))
    report = {'method': 'HTTP availability and literal quote matching; factual reading performed separately',
              'questionBankSha256': hashlib.sha256((ROOT / 'src/questions.json').read_bytes()).hexdigest(),
              'questions': len(questions), 'sources': len(results),
              'passed': all(result['passed'] for result in results), 'results': results}
    Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    for result in results:
        print(('PASS' if result['passed'] else 'FAIL') + ' ' + ','.join(result['questions']) + ' ' + result['url'])
        if not result['passed']:
            print(json.dumps(result, ensure_ascii=False))
    raise SystemExit(0 if report['passed'] else 1)

if __name__ == '__main__':
    main()
