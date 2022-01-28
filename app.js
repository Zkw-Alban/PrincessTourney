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

function saveUserInscription(fileToSave) {
    fs.readFile(path.join(__dirname, "public/docs/name.json"), function (err, data) {
        var jsonObj = JSON.parse(data);
        var keys = Object.keys(jsonObj.members);
        //création d'un nouveau user
        var i = keys.length + 1;
        var newUser = "user" + i;
        var newValue = fileToSave;
        jsonObj.members[newUser] = newValue;
        try {
            fs.writeFileSync(path.join(__dirname, "public/docs/name.json"), JSON.stringify(jsonObj));
            return newUser;
        } catch (e) {
            return "failed sign in";
        }
    })
}

//à la première connexion --> direction la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public/chat.html"));
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
const PRETRE = [2, "img/2Pretre.jpg", "Pretre", "Regardez la main d'un joueur de votre choix."]
const BARON = [3, "img/3Baron.jpg", "Baron", "Comparez la carte de votre main avec celle d'un Jersaire. Celui qui a la carte la plus faible est éliminé."]
const SERVANTE = [4, "img/4Servante.jpg", "Servante", "Aucun joueur ne peut vous cibler ce tour-ci."]
const PRINCE = [5, "img/5Prince.jpg", "Prince", "Défaussez la carte d'un joueur (y compris vous-même)."]
const CHANCELIER = [6, "img/6Chancelier.jpg", "Chancelier", "Piochez la première carte du paquet et rejouez."]
const ROI = [7, "img/7Roi.jpg", "Roi", "Échangez votre carte avec un autre joueur."]
const COMTESSE = [8, "img/8Comtesse.jpg", "Comtesse", "Si vous possédez un Prince (5) ou un Roi (7), vous devez jouer la Comtesse."]
const PRINCESSE = [9, "img/9Princesse.jpg", "Princesse", "Si cette carte est jouée ou défaussée, son propriétaire est éliminé."]
const CARDLIST = [ESPIONNE, GARDE, PRETRE, BARON, SERVANTE, PRINCE, CHANCELIER, ROI, COMTESSE, PRINCESSE]

//id joueur - statut (1 = en vie, 0 = mort) - main - dernière carte jouée - historique des cartes jouées
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
var J0 = [0, 1, mainJ0, "", historiqueJ0];
var J1 = [1, 1, mainJ1, "", historiqueJ1];
var J2 = [2, 1, mainJ2, "", historiqueJ2];
var J3 = [3, 1, mainJ3, "", historiqueJ3];
var J4 = [4, 1, mainJ4, "", historiqueJ4];
var joueursVivants = [J0, J1, J2, J3, J4];

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

let NBJOUEURS = 0;

let JoueurActuel = J0;

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
            //affichage conditionnel selon si c'est le joueur principal ou un adversaire qui a la carte
            /*if (joueur == "joueur actuel") {
                document.getElementById("player" + joueur[0] + "Card" + emplacement).style.background = "top / contain #FFFFFF url('" + CARDLIST[index][1] + "') no-repeat";
            } else document.getElementById("player" + joueur[0] + "Card" + emplacement).style.background = "left / contain #FFFFFF url('" + CARDLIST[index][1] + "') no-repeat";

            //document.getElementById("player" + joueur[0] + "Card" + emplacement).innerHTML = "[" + CARDLIST[index][0] + "] " + CARDLIST[index][2];
            $("#player" + joueur[0] + "Card" + emplacement).html("[" + CARDLIST[index][0] + "] " + CARDLIST[index][2]);
            if (joueur == J0) {
                $("#playerCardDesc" + emplacement).html(CARDLIST[index][3]);
                //document.getElementById("playerCardDesc" + emplacement).innerHTML = CARDLIST[index][3];
            }*/
            break;
        }
    }
}

function getCardInHand(joueur) {
    if (joueur[2][0] == NOCARD) {
        return joueur[2][1];
    }
    else return joueur[2][0];
}

function pioche(joueur) {
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
    //mettre à jour le nombre de cartes dans le deck
    return DECK.length;
}

//à vérifier
function hasWon(joueursVivants) {
    meilleurCarte = NOCARD;
    //penser aux cas d'égalité (tableau)
    joueursGagnants = NONE;
    if (joueursVivants.length === 1) {
        return joueursVivants[0];
    } else {
        joueursVivants.forEach(joueur => {
            if (meilleurCarte < getCardInHand(joueur)) {
                meilleurCarte = getCardInHand(joueur);
                joueursGagnants = joueur;
            }
        });
    }
}

function validerJouer(joueur, carteJouee, emplacement) {
    //on historise la carte jouée (affichage)
    joueur[4].push(carteJouee[2]);
    //on log la dernière carte jouée (pour effets de cartes)
    joueur[3] = carteJouee;

    //on nettoie l'affichage de l'emplacement  
    joueur[2][emplacement] = NOCARD;

    //envoyer de quoi afficher
    /*document.getElementById("player" + joueur[0] + "Card" + emplacement).style.background = "top / contain #FFFFFF url('" + joueur[2][emplacement][1] + "') no-repeat";
    document.getElementById("player" + joueur[0] + "Card" + emplacement).innerHTML = joueur[2][emplacement][2];
    document.getElementById("playerCardDesc" + emplacement).innerHTML = J0[2][emplacement][3];
    document.getElementById("historiquetablej" + joueur[0]).innerHTML = joueur[4];*/
}

function jouer(joueur, emplacement) {
    //si le deck est vide on ne joue pas
    if (DECK.length === 0) {
        alert("deck vide, partie finie");
        return 99;
    }

    //emplacement a la valeur 0 (gauche) ou 1 (droite) 
    if (joueur[2][emplacement] == NOCARD) {
        alert("Vous n'avez aucune carte à jouer à cet emplacement.");
    }
    else {
        carteJouee = joueur[2][emplacement];

        //sélection aléatoire si pas joueur humain
        if (joueur != J0) {
            //le garde peut pas s'autocibler     
            joueurCible = joueur[0];
            if (carteJouee == GARDE) {
                //on récupère l'id du joueur, et tant qu'on a pas une autre id on relance                
                while (joueurCible == joueur[0] || joueursVivants[joueurCible][3] == SERVANTE) {
                    joueurCible = getRandomInt(0, 4);
                }
                //on sélectionne un rôle au hasard en excluant le garde
                idroleCible = 1;
                while (roleCible == 1) {
                    idroleCible = getRandomInt(0, 9);
                }
                roleCible = CARDLIST[idroleCible][2];
            }
            else {
                while (joueursVivants[joueurCible][3] == SERVANTE) {
                    joueurCible = getRandomInt(0, 4);
                }

            }
        } else {
            //prise en compte de la sélection
            selectJC = document.getElementById("playSelectJoueur" + emplacement);
            joueurCible = selectJC.options[selectJC.selectedIndex].value;
            selectRC = document.getElementById("playSelectRole" + emplacement);
            roleCible = selectRC.options[selectRC.selectedIndex].value;
        }

        //effet des cartes
        //idée : enlever les gens morts de la liste des gens vivants
        if (carteJouee == GARDE) {
            if (joueursVivants[joueurCible][3] != SERVANTE && joueurCible != "0" && joueursVivants[joueurCible][1] == 1) {
                roleReelJoueurCible = getCardInHand(joueursVivants[joueurCible])[2].toLowerCase();
                if (roleReelJoueurCible == roleCible.toLowerCase()) {
                    document.getElementById("player" + joueursVivants[joueurCible][0] + "Card1").innerHTML = "Joueur décédé.";
                    joueursVivants[joueurCible][1] = 0;
                }
                //valider l'action
                validerJouer(joueur, carteJouee, emplacement);
                //jouerIA(joueur);
            }

        } else if (carteJouee == PRETRE) {
            validerJouer(joueur, carteJouee, emplacement);
            //jouerIA(joueur);

        } else if (carteJouee == BARON) {
            if (joueursVivants[joueurCible][3] != SERVANTE && joueurCible != "0" && joueursVivants[joueurCible][1] == 1) {
                //on valide le fait de jouer avant d'appliquer les effets du baron
                validerJouer(joueur, carteJouee, emplacement);
                //joueur vivant se trouve avec l'id
                forceJoueurCible = getCardInHand(joueursVivants[joueurCible])[0];
                forceInitiateur = getCardInHand(joueursVivants[joueur[0]])[0];
                //le joueur ciblé meure s'il est moins fort
                if (forceInitiateur > forceJoueurCible) {
                    joueursVivants[joueurCible][1] = 0;
                    document.getElementById("player" + joueursVivants[joueurCible][0] + "Card1").innerHTML = "Joueur décédé.";
                } else if (forceInitiateur < forceJoueurCible) {
                    joueursVivants[joueur[0]][1] = 0;
                    document.getElementById("player" + joueursVivants[joueur[0]][0] + "Card1").innerHTML = "Joueur décédé.";
                }
                //jouerIA(joueur);
            }

        } else if (carteJouee == PRINCE) {
            if ((joueursVivants[joueurCible][3] != SERVANTE && joueursVivants[joueurCible][1] == 1) || joueurCible == "0") {
                validerJouer(joueur, carteJouee, emplacement);
                //on indique quelle carte a été défaussée
                carteDefaussee = getCardInHand(joueursVivants[joueurCible]);
                joueursVivants[joueurCible][4].push(carteDefaussee[2]);
                //si la princesse est défaussée son propriétaire est mort
                if (carteDefaussee == PRINCESSE) {
                    joueursVivants[joueur[0]][1] = 0;
                    document.getElementById("player" + joueursVivants[joueurCible][0] + "Card1").innerHTML = "Joueur décédé.";
                    //sinon on vide sa main et on repioche une carte
                } else {
                    joueursVivants[joueurCible][2][0] = NOCARD;
                    joueursVivants[joueurCible][2][1] = NOCARD;
                    pioche(joueursVivants[joueurCible]);
                }
                //jouerIA(joueur);
            }

        } else if (carteJouee == CHANCELIER) {
            validerJouer(joueur, carteJouee, emplacement);
            if (joueur == J0) {
                pioche(joueur);
            } else {
                //on fait rejouer le bot
                pioche(joueursVivants[joueur[0] - 1]);
                jouer(joueur);
            }

        } else if (carteJouee == ROI) {
            if (joueursVivants[joueurCible][3] != SERVANTE && joueursVivants[joueurCible][1] == 1 && joueurCible != "0") {
                validerJouer(joueur, carteJouee, emplacement);
                //on prend les cartes des deux joueurs
                carteJoueurCible = getCardInHand(joueursVivants[joueurCible]);
                carteInitiateur = getCardInHand(joueursVivants[joueur[0]]);
                //on échange les cartes des deux joueurs et on vide la main droite
                getCard(carteInitiateur[0], 0, joueursVivants[joueurCible]);
                getCard(NOCARD[0], 0, joueursVivants[joueurCible]);
                getCard(carteJoueurCible[0], 0, joueursVivants[joueur[0]]);
                getCard(NOCARD[0], 0, joueursVivants[joueur[0]]);
                //jouerIA(joueur);
            }

            //la princesse est impossible à jouer
        } else if (carteJouee == PRINCESSE) { }

        else {
            validerJouer(joueur, carteJouee, emplacement);
            //jouerIA(joueur);
        }

        //verifier la victoire
        //hasWon(joueursVivants);
    }
}

//vérifie si on a la princesse dans la main et renvoie la position de la carte non princesse dans la main (donc de la carte à jouer)
function checkPrincesse(joueur) {
    card0 = joueur[2][0];
    card1 = joueur[2][1];
    if (card0 == PRINCESSE) {
        return 1;
    } else if (card1 == PRINCESSE) {
        return 0;
    }
    else return 2;
}

//vérifie si on doit absolument jouer la comtesse et renvoie la position de la carte comtesse dans la main (donc de la carte à jouer)
function checkComtesse(joueur) {
    card0 = joueur[2][0];
    card1 = joueur[2][1];
    if (card0 == COMTESSE && (card1 == PRINCE || card1 == ROI || card1 == PRINCESSE)) {
        return 0;
    } else if (card1 == COMTESSE && (card0 == PRINCE || card0 == ROI || card0 == PRINCESSE)) {
        return 1;
    }
    else return 2;
}

function newGame(nbJoueurs) {
    //on réinitialise tout
    DECK = initDeck();
    NBJOUEURS = nbJoueurs;
    mainJoueur = [NOCARD, NOCARD];
    mainADV1 = [NOCARD, NOCARD];
    mainADV2 = [NOCARD, NOCARD];
    mainADV3 = [NOCARD, NOCARD];
    mainADV4 = [NOCARD, NOCARD];
    historiqueJoueur = [];
    historiqueADV1 = [];
    historiqueADV2 = [];
    historiqueADV3 = [];
    historiqueADV4 = [];
    J0 = [0, 1, mainJoueur, "", historiqueJoueur];
    ADV1 = [1, 1, mainADV1, "", historiqueADV1];
    ADV2 = [2, 1, mainADV2, "", historiqueADV2];
    ADV3 = [3, 1, mainADV3, "", historiqueADV3];
    ADV4 = [4, 1, mainADV4, "", historiqueADV4];
    joueursVivants = [J0, ADV1, ADV2, ADV3, ADV4];

    //on affiche qu'il n'y a pas de cartes
    for (let emplacement = 0; emplacement < 2; emplacement++) {
        for (let jliste = 0; jliste < nbJoueurs; jliste++) {
            document.getElementById("player" + jliste + "Card" + emplacement).style.background = "top / contain #FFFFFF url('" + J0[2][emplacement][1] + "') no-repeat";
            document.getElementById("player" + jliste + "Card" + emplacement).innerHTML = J0[2][emplacement][2];
            document.getElementById("historiquetablej" + jliste).innerHTML = "";
        }
    }

    //on enlève une carte au hasard
    carteEnlevee = getRandomInt(0, 21);
    document.getElementById("deckcontent").innerHTML = "Carte enlevée : " + DECK[carteEnlevee][2];
    DECK.splice(carteEnlevee, 1);

    //on fait piocher le premier joueur
    pioche(J0);
    pioche(ADV1);
    pioche(ADV2);
    pioche(ADV3);
    pioche(ADV4);
}

// ------------------------------------ PARTIE SOCKET -----------------------------------------------

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('register', (userName) => {
        saveUserInscription(userName);
        socket.id = userName;
        console.log("user saved in db with name " + socket.id);
        var usersConnected = Array.from(io.sockets.sockets.values());
        var idUsersConnected = new Array(usersConnected.length);
        for (var i = 0; i < usersConnected.length; i++) {
            idUsersConnected.push(usersConnected[i].id);
        }
        io.emit("register", idUsersConnected);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', socket.id + ": " + msg);
    });

    socket.on('loveLetterChat message', (msg) => {
        io.emit('loveLetterChat message', socket.id + ": " + msg);
    });
});