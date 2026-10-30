import bundledQuestions from './questions.json' with { type: 'json' };
export const STORE = 'minuit.quiz.v1';
export const categories = {
  cinema: { name: 'Films & séries d’horreur', icon: '✦', color: '#c5b5ff', description: 'Cinéma, séries & frissons' },
  crime: { name: 'Tueurs en série', icon: '◈', color: '#e6a883', description: 'Enquêtes & histoire criminelle' },
  france: { name: 'Faits divers français', icon: '⌕', color: '#a9c9bd', description: 'Archives & affaires françaises' },
};
export const BANK_VERSION = 2;
export const initialQuestions = bundledQuestions;
export function initialState(){return {version:1,questionBankVersion:BANK_VERSION,teams:[],players:[],questions:structuredClone(initialQuestions),ledger:[],session:{stage:'lobby',questionId:null,clue:0,revealed:false,visited:[]}};}
// A new evening needs an entirely fresh bank. Preserve the previous game as an exportable archive.
export function upgradeLegacyQuestions(state){
 if(state.questionBankVersion>=BANK_VERSION)return 0;
 const previous=structuredClone(state);
 delete previous.previousEdition;
 state.previousEdition=previous;
 state.questions=structuredClone(initialQuestions);
 state.ledger=[];
 state.session={stage:'lobby',questionId:null,clue:0,revealed:false,visited:[]};
 state.questionBankVersion=BANK_VERSION;
 return state.questions.length;
}
export function prepareNextQuestion(state){
 if(state.session.stage==='theme')return current(state);
 const q=available(state).find(q=>!state.session.visited.includes(q.id));
 if(!q){state.session.stage='end';return null;}
 state.session={...state.session,stage:'theme',questionId:q.id,clue:0,revealed:false,visited:[...state.session.visited,q.id]};
 return q;
}
export function revealQuestion(state){
 if(state.session.stage!=='theme'||!playable(current(state)))return false;
 state.session.stage='question';return true;
}
export function score(state,id){return state.ledger.filter(x=>x.teamId===id).reduce((n,x)=>n+x.delta,0);}
export function playable(q){return !!q && q.verified === true && !!q.prompt.trim() && !!q.answer.trim() && (q.mode!=='image'||(q.clues.length===3&&q.clues.every(x=>validUrl(x)&&x.startsWith('https://')))) && q.sources.length>0 && q.sources.every(s=>s.title.trim() && s.evidence.trim() && validUrl(s.url));}
export function validUrl(value){try{return ['https:','http:'].includes(new URL(value).protocol);}catch{return false;}}
export function available(state){return state.questions.filter(playable);}
export function current(state){return state.questions.find(q=>q.id===state.session.questionId);}
export function valueFor(state){return Math.max(1,3-state.session.clue);}
export function award(state,teamId,delta,questionId=null){
 if(!state.teams.some(t=>t.id===teamId)||!Number.isInteger(delta)||delta===0||Math.abs(delta)>100) return false;
 if(questionId && (state.session.stage!=='question'||state.session.questionId!==questionId||!playable(current(state))))return false;
 if(questionId && state.ledger.some(x=>x.questionId===questionId&&x.teamId===teamId&&x.kind==='answer')) return false;
 state.ledger.push({id:crypto.randomUUID(),teamId,delta,questionId,kind:questionId?'answer':'manual',at:new Date().toISOString()});return true;
}
export function validateState(s){
 if(!s||s.version!==1||!Array.isArray(s.teams)||!Array.isArray(s.players)||!Array.isArray(s.questions)||!Array.isArray(s.ledger)||!s.session)throw Error('Format de sauvegarde incompatible.');
 if(s.teams.length>100||s.players.length>500||s.questions.length>300||s.ledger.length>20000)throw Error('Sauvegarde trop volumineuse.');
 const str=x=>typeof x==='string';const ids=xs=>xs.every(x=>x&&str(x.id)&&/^[a-zA-Z0-9_-]{1,80}$/.test(x.id))&&new Set(xs.map(x=>x.id)).size===xs.length;
 if(!ids(s.teams)||!ids(s.players)||!ids(s.questions)||!ids(s.ledger))throw Error('Identifiants invalides ou dupliqués.');
 if(!s.teams.every(t=>str(t.name)&&t.name.length>0&&t.name.length<=60&&/^#[0-9a-f]{6}$/i.test(t.color)))throw Error('Équipes invalides.');
 if(!s.players.every(p=>str(p.name)&&p.name.length>0&&p.name.length<=60&&(p.teamId===null||s.teams.some(t=>t.id===p.teamId))))throw Error('Joueurs invalides.');
 if(!s.questions.every(q=>categories[q.category]&&['text','image'].includes(q.mode)&&str(q.title)&&str(q.prompt)&&str(q.answer)&&str(q.explanation)&&typeof q.verified==='boolean'&&Array.isArray(q.clues)&&q.clues.length<=3&&q.clues.every(str)&&Array.isArray(q.sources)&&q.sources.every(x=>x&&str(x.title)&&str(x.url)&&str(x.evidence))))throw Error('Questions invalides.');
 if(!s.ledger.every(x=>s.teams.some(t=>t.id===x.teamId)&&Number.isInteger(x.delta)&&Math.abs(x.delta)<=100&&['manual','answer'].includes(x.kind)&&str(x.at)&&(x.questionId===null||s.questions.some(q=>q.id===x.questionId))))throw Error('Historique invalide.');
 const p=s.session;if(!['lobby','theme','question','scores','end'].includes(p.stage)||!Number.isInteger(p.clue)||p.clue<0||p.clue>2||typeof p.revealed!=='boolean'||!Array.isArray(p.visited)||!p.visited.every(id=>s.questions.some(q=>q.id===id))||(p.questionId!==null&&!s.questions.some(q=>q.id===p.questionId)))throw Error('Partie invalide.');
 if(['theme','question'].includes(p.stage)&&!playable(current(s)))throw Error('La question active n’est pas vérifiée.');
 return s;
}
