# Minuit — Le quiz de l’étrange

Première version d’un quiz de soirée pour adultes, sans images choquantes : régie, écran public distinct, équipes, joueurs, scores et questions documentées.

## Essayer avec le lanceur portable

Télécharger puis extraire entièrement `releases/Minuit-portable.zip`. Installer [Node.js LTS](https://nodejs.org) une seule fois, puis ouvrir `Lancer Minuit.bat` sous Windows. Sur Mac, exécuter `sh "Lancer Minuit.command"` depuis le dossier extrait ; sous Linux, `sh "Lancer Minuit.sh"`. Le lanceur ouvre le navigateur et doit rester ouvert pendant la partie. Le guide `LIRE-MOI.txt` du ZIP détaille l’utilisation des deux écrans.

Le dossier portable inclut l’application compilée, ses polices, les 50 questions Halloween et 10 questions Warhammer Fantasy. Aucune installation npm n’est requise pour l’utiliser. Les références externes nécessitent Internet. Le stockage est propre au navigateur et à l’adresse utilisée : exporter/importer pour transférer une partie existante.

Pour reconstruire le ZIP depuis le dépôt (Node.js de développement et Python 3 requis) :

```sh
npm ci
npm run package:portable
```

## Choisir son édition

Le sélecteur **Édition** est disponible en haut de la régie, sur ordinateur et mobile. Il propose **Halloween · Édition 02** (50 questions) et **Warhammer Fantasy** (10 questions). Chaque univers possède ses couleurs, sa typographie, ses emblèmes et ses catégories, appliqués aussi à la projection.

La première ouverture d’une édition reprend les équipes et joueurs de l’édition active, avec des scores à zéro. Ensuite, chaque édition conserve indépendamment ses participants, questions personnalisées, historique de points, question active, étape thème/question, indices, révélation et questions visitées. Un changement d’édition restaure immédiatement cette partie sur les deux écrans. Les remises à zéro et suppressions concernent uniquement l’édition active. L’export JSON sauvegarde les deux éditions ; l’import les restaure ensemble. Les sauvegardes de l’édition 02 déjà utilisées restent intactes.

Les 10 questions Warhammer Fantasy concernent le **Vieux Monde**, documenté par cinq articles officiels de Games Workshop sur **The Old World**. Les faits dépendant d’une époque sont datés dans l’énoncé. Chaque fiche fournit le lien exact, l’organisme, la date de publication, la section, un court repère original et la date de consultation. Voir le [dossier des questions](docs/warhammer-questions.md) et la [revue documentaire](docs/warhammer-source-review.json), liée à l’empreinte SHA-256 de la banque. Ces sources ont été lues via le navigateur documentaire le 31 octobre 2026 ; le rapport distingue cette lecture du contrôle HTTP automatique de la banque Halloween.

Télécharger le ZIP depuis [le dossier GitHub](https://github.com/PaulH-svg/Quizz/tree/codex/minuit-portable/telechargements). Les références nécessitent Internet ; le jeu et ses habillages fonctionnent localement.

## Démarrer

Node.js 22.12+ ou 24 LTS, npm.

```sh
npm ci
npm run dev
```

Pour vérifier la version de production :

```sh
npm run build
npm run preview
```

Les polices sont installées localement. Aucun compte, service externe ou clé API n’est nécessaire pour l’application. Les sources et les images externes nécessitent leur accès réseau.

## Utilisation sur deux écrans

1. Configurer l’affichage de l’ordinateur en **bureau étendu**.
2. Dans « Joueurs & équipes », créer les équipes et affecter les joueurs. Une équipe peut aussi représenter un joueur seul.
3. Dans « Les questions », préparer les questions, leurs indices et leurs références, puis vérifier chaque réponse en lisant la source.
4. Cliquer sur « Ouvrir la projection », déplacer la nouvelle fenêtre sur le projecteur et activer « Plein écran ».
5. Garder « Régie du quiz » sur l’écran de l’animateur. Démarrer pour afficher le thème, cliquer sur « Afficher la question », puis donner les indices, attribuer les points, révéler les réponses et afficher le classement.

Les deux fenêtres doivent appartenir au **même navigateur, au même profil et à la même origine**. Elles se synchronisent avec BroadcastChannel et les événements de stockage. Cette version ne propose pas de connexion à distance depuis un téléphone ou un autre ordinateur. Utiliser une seule fenêtre de régie pour éviter des modifications concurrentes.

Les points sont attribués par l’animateur : 3 sans indice, 2 après le premier indice, 1 après le second. Pour les images, les trois visuels valent respectivement 3, 2 et 1 point. Plusieurs équipes peuvent recevoir les points pour une question ; une même équipe ne peut être créditée qu’une fois par le bouton « Bonne réponse ». Les ajustements manuels et l’annulation restent disponibles.

Une image manquante est signalée à l’écran ; la version actuelle ne télécharge ni ne recadre automatiquement des images de films. Préparer trois visuels autorisés, de plus en plus reconnaissables, en HTTPS, et documenter leur provenance et leurs droits dans la référence.

## Engagement éditorial et état de la banque

La banque de l’**édition 02** comprend **50 questions entièrement renouvelées**, vérifiées le 30 octobre 2026 : **25 films/séries d’horreur, 13 tueurs en série et 12 faits divers français**. Aucun énoncé de l’édition précédente n’est repris. Les thèmes alternent ; classiques, films récents et séries sont répartis dans toute la soirée.

Les indices apportent des repères d’intrigue, de distribution ou d’enquête, puis un élément plus reconnaissable. Les questions françaises concernent des affaires criminelles modernes ; les sujets de monarchie et d’histoire nationale ont été retirés.

Pour chaque question, la projection affiche d’abord **le thème seul**. L’animateur clique sur **« Afficher la question »** avant de donner les indices ou de révéler la réponse. L’attribution de points pour une bonne réponse est bloquée pendant l’annonce du thème.

Chaque question possède deux indices, une réponse, une explication et des références avec les passages exacts et la date de consultation. Les sources sont des versions figées de Wikipédia et des notices Britannica. La lecture humaine couvre les énoncés, réponses, indices et explications ; le contrôle automatisé couvre les liens et les citations, pas la vérité sémantique.

Voir le [dossier des 50 questions](docs/questions-verifiees.md) et le [rapport de vérification des sources](docs/source-verification.json). Pour renouveler le contrôle et le guide :

```sh
python3 scripts/verify-sources.py
python3 scripts/generate-question-guide.py
```

Au premier chargement de l’édition 02, la banque précédente est entièrement remplacée. **Les équipes et joueurs restent en place ; les scores et le déroulé sont remis à zéro pour la nouvelle soirée.** L’ancienne partie complète (y compris ses questions personnalisées et ses points) est conservée dans `previousEdition`, et peut être téléchargée via **« Exporter l’ancienne partie »**. Une sauvegarde importée de l’édition 01 est traitée de la même façon. La migration ne se répète pas sur une partie déjà en édition 02.

Cette banque reste textuelle ; les images de films ne sont pas encore fournies.

Chaque question jouable exige :

- un énoncé et une réponse exacte ;
- une référence avec publication, auteur ou organisme et date ;
- l’URL exacte de la page ;
- le passage, la section, la page ou le minutage établissant la réponse ;
- une attestation manuelle de vérification par l’animateur.

L’application contrôle la présence et le format de ces éléments. **Elle ne vérifie pas automatiquement la véracité du contenu.** Les nouvelles questions ou modifications restent soumises à cette vérification manuelle. Les brouillons ne peuvent pas être projetés. Les réponses et sources ne sont affichées au public qu’après révélation ; l’animateur peut consulter la réponse en régie avant cela.

Privilégier les sources primaires, les archives et les références institutionnelles. Distinguer strictement condamnations, accusations et affaires non résolues. Éviter les anecdotes invérifiables, les bilans controversés et toute présentation glorifiant les auteurs ou négligeant les victimes. Ne pas diffuser d’images graphiques.

## Données et sauvegardes

Les équipes, joueurs, questions et points restent dans le stockage local du navigateur. Un rechargement reprend la partie. Exporter régulièrement le fichier JSON, particulièrement avant un import ou l’effacement des données du navigateur. Le fichier contient les noms des participants ; le conserver avec soin.

L’import valide les identifiants, les équipes, les questions, l’historique et la session. Un import remplace les données après confirmation. Une sauvegarde illisible n’est pas écrasée automatiquement.

Les données ne sont pas partagées entre machines. Changer de port, de domaine ou de profil de navigateur crée un espace de sauvegarde distinct.

## Validation

```sh
npm test
npm run build
npm run test:ui
```

Les tests du modèle couvrent les 50 questions, la répartition exacte, l’absence de reprises, les 50 transitions thème/question, les points progressifs, les doublons, l’annulation et l’archivage de l’ancienne partie. Les tests navigateur couvrent la création d’équipe et de joueur, l’édition d’une question de test explicitement fictive, la synchronisation avec la projection, la non-divulgation de la réponse, l’attribution et l’annulation des scores, la persistance et le format mobile. Les données de test ne sont pas livrées dans la banque.

Playwright utilise Chromium installé à `/usr/bin/chromium`. Si nécessaire, définir `CHROMIUM_PATH` vers votre exécutable. L’environnement cloud contient déjà Chromium ; aucun téléchargement de navigateur n’est requis.

## Structure

- `src/main.js` : interface de régie et de projection.
- `src/model.js` : validation, migration des sauvegardes, règles de score et critères de publication des questions.
- `src/questions.json` : banque éditoriale et références précises.
- `docs/questions-verifiees.md` : dossier lisible de toutes les questions et citations.
- `scripts/verify-sources.py` : contrôle réseau reproductible des références et citations.
- `src/style.css` : thème Halloween et affichages adaptatifs.
- `tests/` : tests du modèle et tests fonctionnels navigateur.

Les tâches cloud disposent déjà d’un environnement isolé : utiliser le checkout existant, sans créer de worktree sauf demande explicite.
