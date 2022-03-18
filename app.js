'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const fs = require('fs');
const { stringify } = require('querystring');

const { Server } = require("socket.io");


/*var routes = require('./routes/index');
var users = require('./routes/users');*/

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/users', function (req, res) {
    res.send('POST request to the page + ' + req.body.name + ' ' + saveUserInscription(req.body.name));
});



//à la première connexion --> direction la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public/loveLetter.html"));
});

app.get('/users', function (req, res) {
    res.send('GET request to the page');
});

//app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', 1337);

var server = app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + server.address().port);
});

const io = new Server(server);

// ------------------------------------ PARTIE LOVER LETTER -----------------------------------------------
//id carte - image - nom - description
const NOCARD = [-1, "", "PAS DE CARTE", "Vous n'avez pas de carte dans cette main."]
const ESPIONNE = [0, "img/0Espionne.jpg", "Espionne", "Si vous êtes le seul joueur en vie ayant joué ou défaussé une espionne durant la manche, vous gagnez 1 point supplémentaire."]
const GARDE = [1, "img/1Garde.jpg", "Garde", "Devinez la carte d'un autre joueur pour l'éliminer (vous ne pouvez pas citer le Garde)."]
const PRETRE = [2, "img/2Pretre.jpg", "Pretre", "Regardez la main d'un joueur de votre choix. La carte du joueur ciblé s'affichera dans le chat."]
const BARON = [3, "img/3Baron.jpg", "Baron", "Comparez la carte de votre main avec celle d'un Jersaire. Celui qui a la carte la plus faible est éliminé."]
const SERVANTE = [4, "img/4Servante.jpg", "Servante", "Aucun joueur ne peut vous cibler ce tour-ci."]
const PRINCE = [5, "img/5Prince.jpg", "Prince", "Défaussez la carte d'un joueur (y compris vous-même)."]
const CHANCELIER = [6, "img/6Chancelier.jpg", "Chancelier", "Piochez la première carte du paquet et rejouez."]
const ROI = [7, "img/7Roi.jpg", "Roi", "Échangez votre carte avec un autre joueur."]
const COMTESSE = [8, "img/8Comtesse.jpg", "Comtesse", "Si vous possédez un Prince (5) ou un Roi (7), vous devez jouer la Comtesse."]
const PRINCESSE = [9, "img/9Princesse.jpg", "Princesse", "Si cette carte est jouée ou défaussée, son propriétaire est éliminé."]
const CARDLIST = [ESPIONNE, GARDE, PRETRE, BARON, SERVANTE, PRINCE, CHANCELIER, ROI, COMTESSE, PRINCESSE]

//identification du joueur
var j0id = "";
var j1id = "";
var j2id = "";
var j3id = "";
var j4id = "";

var mainJ0 = [NOCARD, NOCARD];
var mainJ1 = [NOCARD, NOCARD];
var mainJ2 = [NOCARD, NOCARD];
var mainJ3 = [NOCARD, NOCARD];
var mainJ4 = [NOCARD, NOCARD];
var historiqueJ0 = [];
var historiqueJ1 = [];
var historiqueJ2 = [];
var historiqueJ3 = [];
var historiqueJ4 = [];
//0:id joueur - 1:statut (1 = en vie, 0 = mort) - 2:main - 3:dernière carte jouée - 4:historique des cartes jouées - 5:nom du joueur (socket.id) - 6: emplacement où afficher le joueur
var J0 = [0, 1, mainJ0, "", historiqueJ0,"",""];
var J1 = [1, 1, mainJ1, "", historiqueJ1,"",""];
var J2 = [2, 1, mainJ2, "", historiqueJ2,"",""];
var J3 = [3, 1, mainJ3, "", historiqueJ3,"",""];
var J4 = [4, 1, mainJ4, "", historiqueJ4,"",""];
var listeJoueurs = [J0, J1, J2, J3, J4];

var winner = "";
//la carte enlevée au début de la manche
var carteEnlevee = [];

//algorithme de Fisher-Yates pour mélanger une liste
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

function initDeck() {
    DECK = [ESPIONNE, ESPIONNE
        , GARDE, GARDE, GARDE, GARDE, GARDE, GARDE
        , PRETRE, PRETRE
        , BARON, BARON
        , SERVANTE, SERVANTE
        , PRINCE, PRINCE
        , CHANCELIER, CHANCELIER
        , ROI
        , COMTESSE
        , PRINCESSE]
    return shuffle(DECK);
}

let DECK = [];

let NBJOUEURS = 5;

let tourActuel = listeJoueurs[0];

function tourSuivant() {
    //détermine le prochain joueur à jouer
    var tourAcheve = tourActuel[0];
    //on repart du joueur actuel et on parcours la liste
    for (var i = tourAcheve + 1; i <= NBJOUEURS; i++) {
        if (i == 5) {
            i = 0;
        }
        if (listeJoueurs[i][1] == 1) { //si le joueur est en vie
            tourActuel = listeJoueurs[i];
            break;
        }
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//fonction pour assigner et afficher une carte à un joueur
function getCard(idCard, emplacement, joueur) {
    for (let index = 0; index < CARDLIST.length; index++) {
        if (idCard == index) {
            joueur[2][emplacement] = CARDLIST[index];
            break;
        }
    }
}

function getCardInHand(joueur) {
//fonction pour trouver quelle carte le joueur a en main
    if (joueur[2][0][0] == NOCARD[0]) {
        return joueur[2][1];
    }
    else return joueur[2][0];
}

function pioche(joueur) {
//piocher = enlever la première carte du deck et l'assigner au joueur
    //on vérifie que le deck contient des cartes
    if (DECK.length > 0) {
        //on vérifie que le joueur est vivant
        if (joueur[1] == 1) {
            //joueur[2] 0 = carte de gauche -- joueur[2] 1 = carte de droite
            if (joueur[2][0] == NOCARD) {
                //récupérer la carte correspondante
                getCard(DECK[0][0], 0, joueur);
                //enlever la carte piochée du deck
                DECK.splice(0, 1);
            } else if (joueur[2][1] == NOCARD) {
                getCard(DECK[0][0], 1, joueur);
                DECK.splice(0, 1);
            }
        }
    }    
    //mettre à jour le nombre de cartes dans le deck
    io.emit('piocher', [DECK.length, [listeJoueurs, tourActuel]]);
    return DECK.length;
}


function checkVictory() {
    var joueursVivants = [];
    //on parcourt la liste des joueurs et quand le joueur est vivant on le place dans la liste correspondante
    for (var i = 0; i < listeJoueurs.length; i++) {
        if (listeJoueurs[i][1] == 1) {
            joueursVivants.push(listeJoueurs[i]);
        }
    }

    //s'il n'y a plus qu'un seul joueur en vie c'est le vainqueur
    if (joueursVivants.length == 1) {
        winner = joueursVivants[0][5];
        return winner;
    }
    //sinon, quand le deck est vide, on regarde la carte la plus forte
    else if (DECK.length == 0) {
        var meilleureCarte = NOCARD;
        //on parcourt la liste des joueurs vivants
        for (var i = 0; i < listeJoueurs.length; i++) {
            if (listeJoueurs[i][1] == 1) {
                if (meilleureCarte[0] < getCardInHand(listeJoueurs[i])[0]) {
                    meilleureCarte = getCardInHand(listeJoueurs[i]);
                    winner = listeJoueurs[i][5];
                }
                //en cas d'égalité on a plusieurs joueurs qui gagnent
                else if (meilleureCarte[0] == getCardInHand(listeJoueurs[i])[0]) {
                    winner = [winner, listeJoueurs[i][5]];
                }
            }
        }
        return winner;
    }
    else {
        return 0;
    }
}

function validerJouer(joueur, carteJouee, emplacement) {
    //quand la carte est jouée on l'historise et on nettoie l'emplacement qu'elle occupait
    //on historise la carte jouée dans la liste
    joueur[4].push(carteJouee[2]);
    //on log la dernière carte jouée (pour effets de cartes)
    joueur[3] = carteJouee;

    //on nettoie l'affichage de l'emplacement  
    joueur[2][emplacement] = NOCARD;
}

function jouer(joueur, carteJouee, emplacement, joueurCible, roleCible) {
    //application des effet des cartes, des ciblages, etc. /!\ on peut cibler les joueurs éliminés (permet de ne pas rester bloqué quand aucun joueur n'est ciblable)
    io.emit('loveLetterChat message', "GAME INFO: Le joueur " + joueur[5] + " (J" + joueur[0] + ") a joué " + carteJouee[2] + " en ciblant le joueur " + listeJoueurs[joueurCible][5] + " (J" + joueurCible + ") et le role " + roleCible);
    if (carteJouee[0] == GARDE[0]) {
        if (listeJoueurs[joueurCible][3][0] == SERVANTE[0]) {
            io.emit('loveLetterChat message', "GAME INFO: Le joueur " + listeJoueurs[joueurCible][5] + " (J" + listeJoueurs[joueurCible][0] + ") ne peut pas être ciblé car protégé par la SERVANTE");
        } else {
            var roleReelJoueurCible = getCardInHand(listeJoueurs[joueurCible])[2].toLowerCase();
            if (roleReelJoueurCible == roleCible.toLowerCase()) {
                //quand le joueur a été démasqué, on l'élimine (joueur[1] = 0) et on historise ses cartes en main pour qu'elle apparaisse dans l'historique
                io.emit('loveLetterChat message', "GAME INFO: Le joueur " + listeJoueurs[joueurCible][5] + " (J" + listeJoueurs[joueurCible][0] + ") a été éliminé");
                listeJoueurs[joueurCible][1] = 0;
                listeJoueurs[joueurCible][4].push(getCardInHand(listeJoueurs[joueurCible])[2]);
                listeJoueurs[joueurCible][3] = getCardInHand(listeJoueurs[joueurCible]);
            }
            //valider l'action
            validerJouer(joueur, carteJouee, emplacement);
            //au final on passe au joueur suivant si il n'y a pas de conditions de victoires remplies
            if (checkVictory() != 0) {
                io.emit('loveLetterChat message', "GAME INFO: Le joueur " + winner + " a gagné la partie !");
                //relancer une nouvelle partie
                //newGame(5);
            } else {
                tourSuivant();
            }
        }

    } else if (carteJouee[0] == PRETRE[0]) {
        if (listeJoueurs[joueurCible][3][0] == SERVANTE[0]) {
            io.emit('loveLetterChat message', "GAME INFO: Le joueur " + listeJoueurs[joueurCible][5] + " (J" + listeJoueurs[joueurCible][0] + ") ne peut pas être ciblé car protégé par la SERVANTE");
        } else {
            validerJouer(joueur, carteJouee, emplacement);
            //le pretre indique la carte possédée par l'adversaire. format : [0] = id du joueur du pretre | [1] = message
            io.emit("pretre", [joueur[0], "PRETRE : Le joueur " + joueurCible + " a la carte " + getCardInHand(listeJoueurs[joueurCible])[2] + " en main."]);
            //au final on passe au joueur suivant si il n'y a pas de conditions de victoires remplies
            if (checkVictory() != 0) {
                io.emit('loveLetterChat message', "GAME INFO: Le joueur " + winner + " a gagné la partie !");
                //relancer une nouvelle partie
                //newGame(5);
            } else {
                tourSuivant();
            }
        }
    } else if (carteJouee[0] == BARON[0]) {
        if (listeJoueurs[joueurCible][3][0] == SERVANTE[0]) {
            io.emit('loveLetterChat message', "GAME INFO: Le joueur " + listeJoueurs[joueurCible][5] + " (J" + listeJoueurs[joueurCible][0] + ") ne peut pas être ciblé car protégé par la SERVANTE");
        } else {
            //on valide le fait de jouer avant d'appliquer les effets du baron
            validerJouer(joueur, carteJouee, emplacement);
            //joueur vivant se trouve avec l'id
            var forceJoueurCible = getCardInHand(listeJoueurs[joueurCible])[0];
            var forceInitiateur = getCardInHand(listeJoueurs[joueur[0]])[0];
            //le joueur ciblé meure s'il est moins fort
            if (forceInitiateur > forceJoueurCible) {
                listeJoueurs[joueurCible][1] = 0;
                listeJoueurs[joueurCible][4].push(getCardInHand(listeJoueurs[joueurCible])[2]);
                listeJoueurs[joueurCible][3] = getCardInHand(listeJoueurs[joueurCible]);
                io.emit('loveLetterChat message', "GAME INFO: Le joueur " + listeJoueurs[joueurCible][5] + " (J" + listeJoueurs[joueurCible][0] + ") a été éliminé");
            } else if (forceInitiateur < forceJoueurCible) {
                listeJoueurs[joueur[0]][1] = 0;
                listeJoueurs[joueur[0]][4].push(getCardInHand(listeJoueurs[joueur[0]])[2]);
                listeJoueurs[joueur[0]][3] = getCardInHand(listeJoueurs[joueur[0]]);
                io.emit('loveLetterChat message', "GAME INFO: Le joueur " + listeJoueurs[joueurCible][5] + " (J" + listeJoueurs[joueurCible][0] + ") a été éliminé");
            }

            //au final on passe au joueur suivant si il n'y a pas de conditions de victoires remplies
            if (checkVictory() != 0) {
                io.emit('loveLetterChat message', "GAME INFO: Le joueur " + winner + " a gagné la partie !");
                //relancer une nouvelle partie
                //newGame(5);
            } else {
                tourSuivant();
            }
        }
    }

    else if (carteJouee[0] == PRINCE[0]) {
        if (listeJoueurs[joueurCible][3][0] == SERVANTE[0]) {
            io.emit('loveLetterChat message', "GAME INFO: Le joueur " + listeJoueurs[joueurCible][5] + " (J" + listeJoueurs[joueurCible][0] + ") ne peut pas être ciblé car protégé par la SERVANTE");
        } else {
            validerJouer(joueur, carteJouee, emplacement);
            //on indique quelle carte a été défaussée
            var carteDefaussee = getCardInHand(listeJoueurs[joueurCible]);
            listeJoueurs[joueurCible][4].push(carteDefaussee[2]);
            //si la princesse est défaussée son propriétaire est mort
            if (carteDefaussee == PRINCESSE) {
                listeJoueurs[joueurCible][1] = 0;
                listeJoueurs[joueurCible][3] = PRINCESSE;
                io.emit('loveLetterChat message', "GAME INFO: Le joueur " + listeJoueurs[joueurCible][5] + " (J" + listeJoueurs[joueurCible][0] + ") a été éliminé car sa Princesse a été défaussée.");
            //sinon on vide sa main et on repioche une carte
            } else {
                listeJoueurs[joueurCible][2][0] = NOCARD;
                listeJoueurs[joueurCible][2][1] = NOCARD;
                if (DECK.length == 0) {
                    listeJoueurs[joueurCible][2][0] = carteEnlevee;
                } else {
                    pioche(listeJoueurs[joueurCible]);
                }                
            }
            //au final on passe au joueur suivant si il n'y a pas de conditions de victoires remplies
            if (checkVictory() != 0) {
                io.emit('loveLetterChat message', "GAME INFO: Le joueur " + winner + " a gagné la partie !");
                //relancer une nouvelle partie
                //newGame(5);
            } else {
                tourSuivant();
            }
        }    

    } else if (carteJouee[0] == CHANCELIER[0]) {
        //le chancelier pioche et rejoue
        validerJouer(joueur, carteJouee, emplacement);
        if (DECK.length == 0) {
            joueur[2][emplacement] = carteEnlevee;
        } else {
            pioche(joueur);
        }          

    } else if (carteJouee[0] == ROI[0]) {
        if (listeJoueurs[joueurCible][3][0] == SERVANTE[0]) {
            io.emit('loveLetterChat message', "GAME INFO: Le joueur " + listeJoueurs[joueurCible][5] + " (J" + listeJoueurs[joueurCible][0] + ") ne peut pas être ciblé car protégé par la SERVANTE");
        } else {
            validerJouer(joueur, carteJouee, emplacement);
            //on prend les cartes des deux joueurs
            var carteJoueurCible = getCardInHand(listeJoueurs[joueurCible]);
            var carteInitiateur = getCardInHand(listeJoueurs[joueur[0]]);
            //on échange les cartes des deux joueurs et on vide la main droite
            listeJoueurs[joueurCible][2][0] = NOCARD;
            listeJoueurs[joueurCible][2][1] = NOCARD;
            getCard(carteInitiateur[0], 0, listeJoueurs[joueurCible]);
            //regarder l'autre main ?
            listeJoueurs[joueur[0]][2][0] = NOCARD;
            listeJoueurs[joueur[0]][2][1] = NOCARD;
            getCard(carteJoueurCible[0], 0, listeJoueurs[joueur[0]]);
            //au final on passe au joueur suivant si il n'y a pas de conditions de victoires remplies
            if (checkVictory() != 0) {
                io.emit('loveLetterChat message', "GAME INFO: Le joueur " + winner + " a gagné la partie !");
                //relancer une nouvelle partie
                //newGame(5);
            } else {
                tourSuivant();
            }
        }

        //la princesse est impossible à jouer
    } else if (carteJouee[0] == PRINCESSE[0]) { }

    else {
        validerJouer(joueur, carteJouee, emplacement);
        //au final on passe au joueur suivant
        //au final on passe au joueur suivant si il n'y a pas de conditions de victoires remplies
        if (checkVictory() != 0) {
            io.emit('loveLetterChat message', "GAME INFO: Le joueur " + winner + " a gagné la partie !");
            //relancer une nouvelle partie
            //newGame(5);
        } else {
            tourSuivant();
        }
    }
}


function newGame(nbJoueurs) {
    //on réinitialise tout
    DECK = initDeck();
    NBJOUEURS = nbJoueurs;
    mainJ0 = [NOCARD, NOCARD];
    mainJ1 = [NOCARD, NOCARD];
    mainJ2 = [NOCARD, NOCARD];
    mainJ3 = [NOCARD, NOCARD];
    mainJ4 = [NOCARD, NOCARD];
    historiqueJ0 = [];
    historiqueJ1 = [];
    historiqueJ2 = [];
    historiqueJ3 = [];
    historiqueJ4 = [];
    //on vide la dernière carte utilisée
    J0[3] = "";
    J1[3] = "";
    J2[3] = "";
    J3[3] = "";
    J4[3] = "";
    //vidage de l'historique
    J0[4] = historiqueJ0;
    J1[4] = historiqueJ1;
    J2[4] = historiqueJ2;
    J3[4] = historiqueJ3;
    J4[4] = historiqueJ4;
    //vidage de la main
    J0[2] = mainJ0;
    J1[2] = mainJ1;
    J2[2] = mainJ2;
    J3[2] = mainJ3;
    J4[2] = mainJ4;
    //remise en vie de tout le monde
    J0[1] = 1;
    J1[1] = 1;
    J2[1] = 1;
    J3[1] = 1;
    J4[1] = 1;
    listeJoueurs = [J0, J1, J2, J3, J4];

    //on enlève une carte au hasard
    var indexCarteEnlevee = getRandomInt(0, 21);
    carteEnlevee = DECK[indexCarteEnlevee];
    //document.getElementById("deckcontent").innerHTML = "Carte enlevée : " + DECK[carteEnlevee][2];
    DECK.splice(indexCarteEnlevee, 1);

    //on fait piocher le premier joueur
    pioche(J0);
    pioche(J1);
    pioche(J2);
    pioche(J3);
    pioche(J4);
}

function getPlayerFromName(name) {
    if (J0[5]==name) {
        return J0;
    } else if (J1[5] == name) {
        return J1;
    }
    else if (J2[5] == name) {
        return J2;
    }
    else if (J3[5] == name) {
        return J3;
    }
    else if (J4[5] == name) {
        return J4;
    }
}

// ------------------------------------ PARTIE SOCKET -----------------------------------------------

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
        if (J0 == getPlayerFromName(socket.id)) {
            j0id = "";
        } else if (J1 == getPlayerFromName(socket.id)) {
            j1id = "";
        } else if (J2 == getPlayerFromName(socket.id)) {
            j2id = "";
        } else if (J3 == getPlayerFromName(socket.id)) {
            j3id = "";
        } else if (J4 == getPlayerFromName(socket.id)) {
            j4id = "";
        }
        //io.emit("loveLetterChat message","Le joueur " + userName + " s'est déconnecté, sa place est libre.");
    });

    socket.on('register', (userName) => {
        //saveUserInscription(userName);
        socket.id = userName;
        var idJoueurActuel = J0;

        //attribution des joueurs par ordre d'arrivée
        if (j0id == "") {
            j0id = userName;
            J0[5] = j0id;
            idJoueurActuel = J0;
            io.emit("loveLetterChat message", "GAME INFO: Le joueur " + userName + " a pris la place de J0.");
        } else if (j1id == "") {
            j1id = userName;
            J1[5] = j1id;
            idJoueurActuel = J1;
            io.emit("loveLetterChat message", "GAME INFO: Le joueur " + userName + " a pris la place de J1.");
        } else if (j2id == "") {
            j2id = userName;
            J2[5] = j2id;
            idJoueurActuel = J2;
            io.emit("loveLetterChat message", "GAME INFO: Le joueur " + userName + " a pris la place de J2.");
        } else if (j3id == "") {
            j3id = userName;
            J3[5] = j3id;
            idJoueurActuel = J3;
            io.emit("loveLetterChat message", "GAME INFO: Le joueur " + userName + " a pris la place de J3.");
        } else if (j4id == "") {
            j4id = userName;
            J4[5] = j4id;
            idJoueurActuel = J4;
            io.emit("loveLetterChat message", "GAME INFO: Le joueur " + userName + " a pris la place de J4.");
        } else {
            io.emit("loveLetterChat message", "GAME INFO: Le joueur " + userName + " ne pourra pas jouer cette partie car toutes les places sont prises.");
            //idJoueurActuel = 5 veut dire que ce n'est pas un joueur
            idJoueurActuel = 5;
        }

        console.log("user registered with name " + socket.id);
        var usersConnected = Array.from(io.sockets.sockets.values());
        var idUsersConnected = new Array(usersConnected.length);
        for (var i = 0; i < usersConnected.length; i++) {
            idUsersConnected.push(usersConnected[i].id);
        }
        io.emit("register", [idUsersConnected,idJoueurActuel, userName]);
    });

    socket.on('jouer', (jeu) => {
        //jeu = [nomJoueur, carteJouee, emplacement, joueurCible, roleCible]
        jouer(getPlayerFromName(jeu[0]),jeu[1], jeu[2], jeu[3], jeu[4]);
        io.emit('jouer', [listeJoueurs, tourActuel]);
        io.emit('loveLetterChat message', "GAME INFO: C'est au joueur " + tourActuel[5] + " (J" + tourActuel[0] + ") de jouer.");
    });

    socket.on('piocher', (nomJoueur) => {
        pioche(getPlayerFromName(nomJoueur));
        //io.emit('piocher', [DECK.length, [listeJoueurs, tourActuel]]);
    });

    socket.on('startNewGame', (nbjoueurs) => {
        newGame(nbjoueurs);
        NBJOUEURS = nbjoueurs;
        io.emit("startNewGame", [listeJoueurs, tourActuel]);
        io.emit('piocher', [DECK.length, listeJoueurs, tourActuel]);
        io.emit("loveLetterChat message", "GAME INFO: La partie commence, c'est au tour de " + tourActuel[5] + " (J" + tourActuel[0] + ") de jouer.");
    });

    socket.on('loveLetterChat message', (msg) => {
        io.emit('loveLetterChat message', socket.id + ": " + msg);
    });
});