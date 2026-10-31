"""Package the built web application and dependency-free local launcher."""
from pathlib import Path
import zipfile
import shutil

root = Path(__file__).resolve().parents[1]
if not (root / 'dist/index.html').is_file():
    raise SystemExit('Exécutez npm run build avant de créer le dossier portable.')
output = root / 'releases/Minuit-portable-multi-editions.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for folder, target in [(root / 'portable', 'Minuit'), (root / 'dist', 'Minuit/web')]:
        for file in sorted(folder.rglob('*')):
            if file.is_file():
                archive.write(file, str(Path(target) / file.relative_to(folder)))
    for file in ['questions-verifiees.md', 'source-verification.json', 'warhammer-questions.md', 'warhammer-source-review.json']:
        archive.write(root / 'docs' / file, 'Minuit/sources/' + file)
shutil.copyfile(output, root / 'releases/Minuit-portable.zip')
print(f'{output} ({output.stat().st_size:,} octets)')
