import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {initialState,initialQuestions,STORE} from '../src/model.js';
const oldQuestions=JSON.parse(readFileSync(new URL('../src/archive/edition1.json',import.meta.url)));
async function addTeam(page){await page.locator('[data-tab="teams"]').click();await page.getByLabel('Nom de l’équipe').fill('Les Veilleurs');await page.locator('#team-form button').click();}
test('theme, question, progressive clues and scores synchronize without leaking answers',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await addTeam(page);
 const popup=context.waitForEvent('page');await page.getByRole('button',{name:'Ouvrir la projection',exact:false}).click();const screen=await popup;await screen.waitForLoadState();
 await page.locator('[data-tab="game"]').click();await page.getByRole('button',{name:'Démarrer',exact:true}).click();
 await expect(screen.locator('.project-theme h2')).toHaveText('Films & séries d’horreur');
 await expect(screen.getByText(initialQuestions[0].prompt,{exact:true})).toHaveCount(0);await expect(screen.locator('.sources')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Bonne réponse +3',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Question suivante',exact:false})).toBeDisabled();
 await page.getByRole('button',{name:'Afficher la question',exact:true}).click();
 await expect(screen.getByRole('heading',{name:initialQuestions[0].prompt,exact:true})).toBeVisible();await expect(screen.getByRole('heading',{name:initialQuestions[0].answer,exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Indice suivant',exact:true}).click();await expect(screen.getByText(initialQuestions[0].clues[0],{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Bonne réponse +2',exact:true}).click();await expect(page.locator('.team-score-title>b')).toContainText('2');await expect(page.getByRole('button',{name:'Bonne réponse +2',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Révéler la réponse',exact:true}).click();await expect(screen.getByRole('heading',{name:initialQuestions[0].answer,exact:true})).toBeVisible();await expect(screen.locator('.sources a').first()).toHaveAttribute('href',/oldid=/);
 await page.getByRole('button',{name:'Annuler le dernier ajout'}).click();await expect(page.locator('.team-score-title>b')).toContainText('0');
 await page.getByRole('button',{name:'Question suivante',exact:false}).click();await expect(screen.locator('.project-theme h2')).toHaveText('Tueurs en série');await expect(screen.getByText(initialQuestions[1].prompt,{exact:true})).toHaveCount(0);
 await page.reload();await page.locator('[data-tab="game"]').click();await expect(page.locator('.project-theme')).toBeVisible();await page.getByRole('button',{name:'Afficher la question',exact:true}).click();await expect(screen.getByRole('heading',{name:initialQuestions[1].prompt,exact:true})).toBeVisible();
 expect(errors).toEqual([]);await screen.close();
});
test('edition 1 migrates to 50 fresh questions and retains a downloadable archive',async({page})=>{
 const data=initialState();data.questionBankVersion=1;data.questions=oldQuestions;data.teams=[{id:'team-old',name:'Équipe conservée',color:'#c5b5ff'}];data.players=[{id:'player-old',name:'Camille',teamId:'team-old'}];data.ledger=[{id:'old-score',teamId:'team-old',delta:9,kind:'answer',questionId:'q1',at:'2026-10-30'}];data.session={stage:'question',questionId:'q1',clue:2,revealed:true,visited:['q1']};
 await page.addInitScript(({key,data})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(data));},{key:STORE,data});await page.goto('/');
 let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORE);expect(saved.questions).toHaveLength(50);expect(saved.ledger).toEqual([]);expect(saved.teams).toEqual(data.teams);expect(saved.players).toEqual(data.players);expect(saved.previousEdition).toEqual(data);expect(saved.session.stage).toBe('lobby');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter l’ancienne partie',exact:true}).click();const download=await downloadPromise;expect(JSON.parse(readFileSync(await download.path(),'utf8'))).toEqual(data);
 await page.reload();saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORE);expect(saved.previousEdition).toEqual(data);
 await page.locator('[data-tab="questions"]').click();const multi=initialQuestions.find(q=>q.sources.length>1);await page.locator(`[data-edit="${multi.id}"]`).click();await page.getByRole('button',{name:'Enregistrer',exact:true}).click();saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),STORE);expect(saved.questions.find(q=>q.id===multi.id).sources).toEqual(multi.sources);
});
test('mobile layout and incomplete sources remain gated',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.locator('[data-tab="questions"]').click();await page.getByRole('button',{name:'Nouvelle question',exact:false}).click();await page.getByLabel('Titre du sujet').fill('Test technique');await page.getByLabel('Question affichée au public').fill('Énoncé de test');await page.getByLabel('Réponse exacte').fill('Réponse de test');await page.getByLabel('J’ai consulté cette référence').check();await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('status')).toContainText('source complète');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await addTeam(page);await page.locator('[data-tab="game"]').click();await page.getByRole('button',{name:'Démarrer',exact:true}).click();await expect(page.locator('.project-theme')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});


test('edition switching synchronizes theme, clues, answers and independent scores; backup round trip',async({page,context})=>{
 await page.goto('/');await page.locator('[data-tab="teams"]').click();await page.getByLabel('Nom de l’équipe').fill('Les Compagnons');await page.locator('#team-form button').click();
 const pop=context.waitForEvent('page');await page.getByRole('button',{name:'Ouvrir la projection',exact:false}).click();const projection=await pop;await projection.waitForLoadState();
 await page.locator('[data-tab="game"]').click();await page.getByRole('button',{name:'Démarrer',exact:true}).click();await page.getByRole('button',{name:'Afficher la question',exact:true}).click();await page.getByRole('button',{name:'Indice suivant',exact:true}).click();await page.getByRole('button',{name:'Bonne réponse +2',exact:true}).click();
 const halloween=await page.evaluate(()=>JSON.parse(localStorage.getItem('minuit.quiz.v1')));
 await page.getByLabel('Édition du quiz').selectOption('warhammer');await expect(projection.locator('html')).toHaveAttribute('data-edition','warhammer');await expect(projection.locator('header')).toContainText('WARHAMMER FANTASY');await expect(page.locator('.team-score-title>b')).toContainText('0');
 await page.getByRole('button',{name:'Démarrer',exact:true}).click();await expect(projection.locator('.project-theme')).toContainText('Royaumes & peuples');await expect(projection.getByText('Ulthuan',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Afficher la question',exact:true}).click();await expect(projection.getByRole('heading',{name:'Quelle île est la patrie des Hauts Elfes ?'})).toBeVisible();await page.getByRole('button',{name:'Bonne réponse +3',exact:true}).click();await page.getByRole('button',{name:'Révéler la réponse',exact:true}).click();await expect(projection.locator('.answer')).toContainText('Ulthuan');
 await page.getByLabel('Édition du quiz').selectOption('halloween');await expect(projection.locator('html')).toHaveAttribute('data-edition','halloween');await expect(page.locator('.team-score-title>b')).toContainText('2');await expect(projection.locator('.clue')).toBeVisible();
 await page.getByLabel('Édition du quiz').selectOption('warhammer');await page.reload();await page.locator('[data-tab="game"]').click();await expect(page.locator('.team-score-title>b')).toContainText('3');await expect(projection.locator('.answer')).toContainText('Ulthuan');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter',exact:true}).click();const savedPath=await (await download).path();
 page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'Remettre les scores à zéro'}).click();await page.locator('#import-file').setInputFiles(savedPath);await expect(page.locator('.team-score-title>b')).toContainText('3');
 const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('minuit.quiz.v1')));expect(restored.savedEditions.halloween.session).toEqual(halloween.session);expect(restored.savedEditions.halloween.ledger).toEqual(halloween.ledger);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await expect(page.getByLabel('Édition du quiz')).toBeVisible();await page.screenshot({path:'/workspace/Quizz/work/warhammer-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.locator('[data-tab="overview"]').click();await page.screenshot({path:'/workspace/Quizz/work/warhammer-desktop.png',fullPage:true});await projection.close();
});

test('projection ignores conflicting stale regie broadcasts across several heartbeats',async({page,context})=>{
 await page.goto('/');
 const oldState=await page.evaluate(()=>JSON.parse(localStorage.getItem('minuit.quiz.v1'))||null);
 const stale=oldState||initialState();
 await page.getByLabel('Édition du quiz').selectOption('warhammer');
 const pop=context.waitForEvent('page');await page.getByRole('button',{name:'Ouvrir la projection',exact:false}).click();const screen=await pop;await screen.waitForLoadState();
 await expect(screen.locator('html')).toHaveAttribute('data-edition','warhammer');
 // Reproduce a second regie running the previous sync code and answering hello
 // with Halloween while the actual saved party is Warhammer.
 await page.evaluate(stale=>{
  window.staleChannel=new BroadcastChannel('minuit-sync');
  window.staleChannel.onmessage=e=>{if(e.data.type==='hello')window.staleChannel.postMessage({type:'state',state:stale});};
  window.staleTimer=setInterval(()=>window.staleChannel.postMessage({type:'state',state:stale}),150);
 },stale);
 const editions=await screen.evaluate(()=>new Promise(resolve=>{
  const seen=[document.documentElement.dataset.edition];
  const observer=new MutationObserver(()=>seen.push(document.documentElement.dataset.edition));
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-edition']});
  setTimeout(()=>{observer.disconnect();resolve(seen);},6500);
 }));
 expect(editions.every(id=>id==='warhammer')).toBeTruthy();
 await page.getByLabel('Édition du quiz').selectOption('halloween');await expect(screen.locator('html')).toHaveAttribute('data-edition','halloween');
 await page.evaluate(()=>{clearInterval(window.staleTimer);window.staleChannel.close();});await screen.close();
});
