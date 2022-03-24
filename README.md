[Aller au Manuel Utilisateur (Wiki)](https://github.com/Zkw-Alban/PrincessTourney/wiki/Manuel-utilisateur)

[Aller au Guide de Maintenance (Wiki)](https://github.com/Zkw-Alban/PrincessTourney/wiki/Guide-de-maintenance)

Pour lancer le serveur, lancer "start_server.bat" ou taper "npm start app.js" dans la console. Nécessite NodeJS pour fonctionner. Dans le navigateur, se connecter au serveur sur le port 1337 (exemple : localhost:1337).

To start the server and play the game, please use "start_server.bat" or type "npm start app.js" in the console. Requires NodeJS to work. In your web browser, connect to the serveur with port 1337 (example : localhost:1337).

# Princess Tourney manuel utilisateur

## But du jeu

5 vaillants joueurs veulent tous obtenir les faveurs de la Princesse lors du Tournoi organisé chaque année par son père le Roi. Parviendrez-vous à sortir du lot ?

Princess Tourney est un jeu de carte où chaque carte correspond à un rôle. Chaque joueur a une carte en main. À votre tour de jeu, vous allez piocher une carte et jouer l'une des deux dans votre main. Chaque carte a une force et des effets bien spécifiques.

La partie peut se terminer de deux façons :
1. Il n'y a plus qu'un seul joueur vivant (celui-ci gagne).
2. Il n'y a plus de cartes dans la pioche. Dans ce cas, le dernier joueur à piocher joue une de ses deux cartes. Si plusieurs joueurs sont vivants, le(s) joueur(s) avec la carte la plus forte gagne(nt).

## Installation du jeu

Le jeu est composé de 21 cartes comme suit :
- 2x Espionne
- 6x Garde
- 2x Prêtre
- 2x Baron
- 2x Servante
- 2x Prince
- 2x Chancelier
- 1x Roi
- 1x Comtesse
- 1x Princesse

Au début de la partie, une carte au hasard est mise de côté puis chaque joueur reçoit une carte. Le premier joueur peut alors piocher et jouer sa première carte pour commencer effectivement la partie.

## Utilisation du logiciel

L'interface de départ demande à rentrer un pseudo. Une fois celui-ci renseigné, le joueur est connecté au serveur et à accès au chat. Si il y a déjà 5 joueurs de conectés, le joueur n'a accès qu'au chat. Dans le cas où une place est libre, le joueur aura la possibilité de piocher des cartes et jouer normalement lorsque ce sera son tour de jeu. Le premier joueur à se connecter a un bouton permettant de commencer la partie en initialisant une première distribution.

Dans le cas où un joueur se déconnecte en cours de partie, le prochain joueur à se connecter prendra sa place sans interrompre la partie.

Pour Piocher une carte à son tour de jeu, il faut cliquer sur la carte "Pioche". Ensuite, pour chacune des deux cartes, on peut la jouer avec le bouton "Jouer" et cibler un joueur et un rôle. Le ciblage se met par défaut sur le joueur 0 et le rôle Espionne. Pour cibler un joueur et un rôle, il suffit de changer la sélection dans la liste déroulante.

À la fin de la partie, le joueur 0 peut décider de relancer une partie avec le bouton "Nouvelle partie".

Pour envoyer un message dans le chat, il suffit de taper le message dans la zone de saisie sous le chat et d'appuyer sur la touche Entrée du clavier ou cliquer sur "Send". Pensez à bien lire le chat, le jeu vous communiquera des informations importantes dedans !
