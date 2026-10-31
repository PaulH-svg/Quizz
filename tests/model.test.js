import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initialState,available,playable,award,score,validateState,valueFor,upgradeLegacyQuestions,initialQuestions,prepareNextQuestion,revealQuestion} from '../src/model.js';
const old=JSON.parse(readFileSync(new URL('../src/archive/edition1.json',import.meta.url)));
const fixture={id:'fixture',category:'cinema',title:'Test technique',prompt:'Question de test',answer:'Réponse de test',explanation:'Test uniquement.',clues:['Indice 1','Indice 2'],sources:[{title:'Source de test',url:'https://example.org/test',evidence:'Passage de test'}],mode:'text',verified:true};
function setup(){const s=initialState();s.teams.push({id:'team1',name:'Les Veilleurs',color:'#c5b5ff'});return s;}
test('50 entirely new questions, exact 25/13/12 balance, interleaved themes and films/series',()=>{
 const s=initialState();assert.equal(s.questions.length,50);assert.equal(available(s).length,50);
 assert.deepEqual(['cinema','crime','france'].map(c=>s.questions.filter(q=>q.category===c).length),[25,13,12]);
 for(let i=0;i<s.questions.length;i++){const q=s.questions[i];assert.ok(!old.some(o=>o.prompt===q.prompt));assert.ok(!old.some(o=>o.id===q.id));if(i)assert.notEqual(q.category,s.questions[i-1].category);assert.equal(q.clues.length,2);assert.ok(q.clues.every(c=>c.length>30));assert.ok(q.sources.every(r=>r.quotes.length&&r.section&&r.consultedAt));}
 assert.doesNotThrow(()=>validateState(s));
});
test('source audit matches the exact shipped bank and all cited pages passed',()=>{
 const raw=readFileSync(new URL('../src/questions.json',import.meta.url));const report=JSON.parse(readFileSync(new URL('../docs/source-verification.json',import.meta.url)));
 assert.equal(report.questionBankSha256,createHash('sha256').update(raw).digest('hex'));assert.equal(report.questions,50);assert.equal(report.passed,true);
 for(const q of initialQuestions)for(const source of q.sources){const result=report.results.find(r=>r.url===source.url);assert.ok(result?.passed);assert.equal(result.status,200);assert.ok(result.questions.includes(q.id));assert.deepEqual(result.missingQuotes,[]);if(source.url.includes('wikipedia.org'))assert.ok(new URL(source.url).searchParams.get('oldid'));}
});
test('edition change archives the exact old game, preserves participants and retires every old question',()=>{
 const s=setup();s.questionBankVersion=1;s.questions=structuredClone(old);s.questions[0].prompt='Question personnalisée conservée en archive';s.players=[{id:'p1',name:'Camille',teamId:'team1'}];s.ledger=[{id:'l1',teamId:'team1',delta:7,questionId:'q1',kind:'answer',at:'2026-10-30'}];s.session={stage:'question',questionId:'q1',clue:1,revealed:true,visited:['q1']};const original=structuredClone(s);
 assert.equal(upgradeLegacyQuestions(s),50);assert.deepEqual(s.previousEdition,original);assert.deepEqual(s.teams,original.teams);assert.deepEqual(s.players,original.players);assert.deepEqual(s.ledger,[]);assert.equal(s.session.stage,'lobby');assert.deepEqual(s.session.visited,[]);assert.equal(upgradeLegacyQuestions(s),0);assert.deepEqual(s.previousEdition,original);assert.doesNotThrow(()=>validateState(s));assert.doesNotThrow(()=>validateState(s.previousEdition));
});
test('all 50 questions require a theme reveal before scoring and end exactly once',()=>{
 const s=setup();const seen=[];
 for(let i=0;i<50;i++){const q=prepareNextQuestion(s);assert.ok(q);assert.equal(s.session.stage,'theme');assert.equal(award(s,'team1',3,q.id),false);assert.equal(prepareNextQuestion(s).id,q.id);assert.equal(revealQuestion(s),true);assert.equal(revealQuestion(s),false);assert.equal(s.session.stage,'question');assert.ok(award(s,'team1',3,q.id));seen.push(q.id);}
 assert.equal(new Set(seen).size,50);assert.equal(prepareNextQuestion(s),null);assert.equal(s.session.stage,'end');assert.equal(score(s,'team1'),150);assert.doesNotThrow(()=>validateState(s));
});
test('progressive scoring prevents duplicate awards and undo restores the previous score',()=>{
 const s=setup();const q=prepareNextQuestion(s);revealQuestion(s);assert.equal(valueFor(s),3);s.session.clue=1;assert.equal(valueFor(s),2);assert.ok(award(s,'team1',2,q.id));assert.equal(award(s,'team1',2,q.id),false);assert.equal(score(s,'team1'),2);award(s,'team1',-1);assert.equal(score(s,'team1'),1);s.ledger.pop();assert.equal(score(s,'team1'),2);s.session.clue=2;assert.equal(valueFor(s),1);assert.equal(award(s,'missing',5),false);
});
test('unverified content and invalid backup sessions remain blocked',()=>{
 for(const mutation of [{verified:false},{sources:[]},{answer:''},{sources:[{title:'Test',url:'javascript:alert(1)',evidence:'Test'}]}])assert.equal(playable({...fixture,...mutation}),false);
 const s=setup();s.questions[0].verified=false;assert.doesNotThrow(()=>validateState(s));for(const stage of ['theme','question'])assert.throws(()=>validateState({...s,session:{...s.session,stage,questionId:s.questions[0].id}}));assert.throws(()=>validateState({...s,teams:[...s.teams,...s.teams]}));assert.throws(()=>validateState({...s,players:[{id:'p',name:'Test',teamId:'missing'}]}));
});
test('image questions still require three secure image URLs',()=>{assert.equal(playable({...fixture,mode:'image'}),false);assert.ok(playable({...fixture,mode:'image',clues:['https://example.org/a.jpg','https://example.org/b.jpg','https://example.org/c.jpg']}));});


const {switchEdition,editionId}=await import('../src/model.js');
test('editions retain independent questions, rosters, scores, clues, revelation and visited history',()=>{
 const s=setup();prepareNextQuestion(s);revealQuestion(s);s.session.clue=1;s.session.revealed=true;award(s,'team1',2,s.session.questionId);s.questions[0].title='Titre personnalisé';
 const halloween=structuredClone(s);
 assert.ok(switchEdition(s,'warhammer'));assert.equal(s.questions.length,10);assert.equal(available(s).length,10);assert.equal(score(s,'team1'),0);assert.deepEqual(s.teams,halloween.teams);
 prepareNextQuestion(s);assert.equal(award(s,'team1',3,s.session.questionId),false);revealQuestion(s);award(s,'team1',3,s.session.questionId);s.players.push({id:'w',name:'Joueur Warhammer',teamId:'team1'});
 const warhammer=structuredClone(s);assert.doesNotThrow(()=>validateState(s));
 switchEdition(s,'halloween');assert.deepEqual(s.session,halloween.session);assert.deepEqual(s.questions,halloween.questions);assert.equal(score(s,'team1'),2);assert.equal(s.players.length,0);
 const restored=validateState(JSON.parse(JSON.stringify(s)));switchEdition(restored,'warhammer');assert.deepEqual(restored.session,warhammer.session);assert.equal(score(restored,'team1'),3);assert.equal(restored.players.length,1);assert.equal(editionId(restored),'warhammer');
 assert.equal(switchEdition(restored,'warhammer'),false);assert.throws(()=>switchEdition(restored,'unknown'));
});
test('imports validate inactive edition data too and legacy edition 02 remains intact',()=>{
 const s=setup(),original=structuredClone(s);assert.doesNotThrow(()=>validateState(s));switchEdition(s,'warhammer');
 const corrupt=structuredClone(s);corrupt.savedEditions.halloween.ledger=[{id:'bad',teamId:'missing',delta:1000}];assert.throws(()=>validateState(corrupt));
 const nested=structuredClone(s);nested.savedEditions.halloween.savedEditions={};assert.throws(()=>validateState(nested));
 switchEdition(s,'halloween');assert.deepEqual(s.questions,original.questions);assert.deepEqual(s.ledger,original.ledger);
});
test('Warhammer sources are official, dated, sectioned and tied to reviewed bank',()=>{
 const s=initialState();switchEdition(s,'warhammer');const raw=readFileSync(new URL('../src/warhammer.json',import.meta.url));const audit=JSON.parse(readFileSync(new URL('../docs/warhammer-source-review.json',import.meta.url)));
 assert.equal(audit.questions,10);assert.equal(audit.questionBankSha256,createHash('sha256').update(raw).digest('hex'));
 for(const q of s.questions){assert.equal(q.clues.length,2);assert.ok(playable(q));for(const source of q.sources){assert.equal(new URL(source.url).hostname,'www.warhammer-community.com');assert.ok(source.section);assert.ok(source.quotes.length);assert.equal(source.consultedAt,'2026-10-31');assert.ok(audit.sources.find(r=>r.url===source.url)?.questions.includes(q.id));}}
});
