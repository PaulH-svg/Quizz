from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
qs=json.loads((root/'src/questions.json').read_text())
report=json.loads((root/'docs/source-verification.json').read_text())
names={'cinema':'Films et séries d’horreur','crime':'Tueurs en série','france':'Faits divers français'}
lines=['# Minuit — Édition 02 : 50 nouvelles questions','',
'Vérification documentaire : **30 octobre 2026**. Répartition : **25 films/séries, 13 tueurs en série, 12 faits divers français**. Les thèmes alternent et les films anciens, modernes et les séries sont répartis dans la soirée. Aucun énoncé de l’édition précédente n’est réutilisé.','',
'Chaque question suit le déroulé : **annonce du thème → affichage de la question (3 points) → indice de contexte (2 points) → indice plus reconnaissable (1 point) → réponse et références**. L’animateur choisit le moment de chaque affichage.','',
f'Les {report["sources"]} pages citées ont été consultées. Les énoncés, réponses, indices et explications ont été relus en regard des passages retenus. Les indices de définition ou de traduction sont des formulations éditoriales ; ils restent fondés sur le terme établi par la source. Les références Wikipédia sont figées par numéro de révision.','',
'Le script `python3 scripts/verify-sources.py` vérifie les réponses HTTP et la présence des extraits. Ce contrôle technique ne remplace pas la lecture factuelle. Le [rapport associé](source-verification.json) porte l’empreinte de la banque exacte.','',
'Les questions françaises portent sur des affaires criminelles connues, sans questions de monarchie ou d’histoire nationale. Les affaires non résolues sont formulées sans désigner de coupable. Aucune image graphique n’est utilisée. La banque repose actuellement sur des indices textuels.','',
'**Pour l’animateur :** une adaptation française et le titre original d’un même film sont acceptables. Les variantes indiquées dans l’explication sont des aides à l’arbitrage ; la régie n’effectue pas de correction automatique des réponses orales.','']
for i,q in enumerate(qs,1):
 lines += [f'## {i:02d}. {q["title"]}','',f'**Thème :** {names[q["category"]]}','',q['prompt'],'',f'**Réponse : {q["answer"]}**','',f'- À 2 points : {q["clues"][0]}',f'- À 1 point : {q["clues"][1]}','',q['explanation'],'']
 for s in q['sources']:lines += [f'**Source :** [{s["title"]}]({s["url"]})','',s['evidence'],'',f'Consultée le {s["consultedAt"]}.','']
(root/'docs/questions-verifiees.md').write_text('\n'.join(lines))
