//gestion de la connexion et des sockets

var socket = io.connect("http://" + window.location.hostname + ":1337", { transports: ['websocket', 'polling', 'flashsocket'] });
//var socket = io.connect("http://127.0.0.1:1337", { transports: ['websocket', 'polling', 'flashsocket'] });

//var loginForm = document.getElementById('loginForm');
//var login = document.getElementById('loginName');
var messages = document.getElementById('messages');
var form = document.getElementById('chatForm');
var input = document.getElementById('chatInput');
var registered = document.getElementById("joueursConnectes");

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value) {
        console.log("msg envoyé : " + input.value);
        socket.emit('loveLetterChat message', input.value);
        input.value = '';
    }
    //return false permet de ne pas recharger la page
    return false;
});

socket.on('loveLetterChat message', function (msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on('register', function (msg) {
    //msg[0] = idUsersConnected - msg[1] = idJoueurActuel - msg[2] = userName
    registered.textContent = msg[0];
    if (msg[2] == document.getElementById("loginName").value) {
        idJoueurClient = msg[1];
    }
});

socket.on('startNewGame', (listeJoueurs) => {
    //rafraichir l'affichage
    //listeJoueurs[0] = liste des joueurs et leur état actuel, listeJoueurs[1] = tourActuel (joueur à qui c'est le tour de jouer)
    refreshGameState(listeJoueurs);
    listeDesJoueurs = listeJoueurs[0];
});

socket.on('piocher', (objet) => {
    //rafraichir l'affichage
    //objet[0] = DECK.length - objet[1] = [listeJoueurs, tourActuel]
    deckLength = objet[0];
    displayPioche(deckLength);
    refreshGameState(objet[1]);
    listeDesJoueurs = objet[1][0];
});

socket.on('jouer', (listeJoueurs) => {
    //rafraichir l'affichage
    //listeJoueurs[0] = liste des joueurs et leur état actuel, listeJoueurs[1] = tourActuel (joueur à qui c'est le tour de jouer)
    listeDesJoueurs = listeJoueurs[0];
    refreshGameState(listeJoueurs);    
});


//id carte - image - nom - description
const NOCARD = [-1, "", "PAS DE CARTE", "Vous n'avez pas de carte dans cette main."]
const ESPIONNE = [0, "img/0Espionne.jpg", "Espionne", "Si vous êtes le seul joueur en vie ayant joué ou défaussé une espionne durant la manche, vous gagnez 1 point supplémentaire."]
const GARDE = [1, "img/1Garde.jpg", "Garde", "Devinez la carte d'un autre joueur pour l'éliminer (vous ne pouvez pas citer le Garde)."]
const PRETRE = [2, "img/2Pretre.jpg", "Pretre", "Regardez la main d'un joueur de votre choix."]
const BARON = [3, "img/3Baron.jpg", "Baron", "Comparez la carte de votre main avec celle d'un adversaire. Celui qui a la carte la plus faible est éliminé."]
const SERVANTE = [4, "img/4Servante.jpg", "Servante", "Aucun joueur ne peut vous cibler ce tour-ci."]
const PRINCE = [5, "img/5Prince.jpg", "Prince", "Défaussez la carte d'un joueur (y compris vous-même)."]
const CHANCELIER = [6, "img/6Chancelier.jpg", "Chancelier", "Piochez la première carte du paquet et rejouez."]
const ROI = [7, "img/7Roi.jpg", "Roi", "Échangez votre carte avec un autre joueur."]
const COMTESSE = [8, "img/8Comtesse.jpg", "Comtesse", "Si vous possédez un Prince (5) ou un Roi (7), vous devez jouer la Comtesse."]
const PRINCESSE = [9, "img/9Princesse.jpg", "Princesse", "Si cette carte est jouée ou défaussée, son propriétaire est éliminé."]
const CARDLIST = [ESPIONNE, GARDE, PRETRE, BARON, SERVANTE, PRINCE, CHANCELIER, ROI, COMTESSE, PRINCESSE]

//dans la liste des joueurs : id joueur - statut (1 = en vie, 0 = mort) - main - dernière carte jouée - historique des cartes jouées - pseudo
let mainJoueur = [NOCARD, NOCARD];
let mainADV1 = [NOCARD, NOCARD];
let mainADV2 = [NOCARD, NOCARD];
let mainADV3 = [NOCARD, NOCARD];
let mainADV4 = [NOCARD, NOCARD];
let historiqueJoueur = [];
let historiqueADV1 = [];
let historiqueADV2 = [];
let historiqueADV3 = [];
let historiqueADV4 = [];
let JOUEURPRINCIPAL = [0, 1, mainJoueur, "", historiqueJoueur];
let ADV1 = [1, 1, mainADV1, "", historiqueADV1];
let ADV2 = [2, 1, mainADV2, "", historiqueADV2];
let ADV3 = [3, 1, mainADV3, "", historiqueADV3];
let ADV4 = [4, 1, mainADV4, "", historiqueADV4];
let listeDesJoueurs = [JOUEURPRINCIPAL, ADV1, ADV2, ADV3, ADV4];

let deckLength = 20;

var tourActuel = JOUEURPRINCIPAL;

//identifier le numéro du joueur dans le serveur (de J0 à J4)
var idJoueurClient = JOUEURPRINCIPAL;

function refreshGameState(listeJoueurs) {
//rafraichit le visuel du jeu pour correspondre à l'état sur le serveur et actualise le joueur qui doit jouer
    var listej = listeJoueurs[0];
        
    for (var joueur = 0; joueur < listej.length; joueur++) {
        getCard(listej[joueur][2][0][0], 0, listej[joueur]);
        getCard(listej[joueur][2][1][0], 1, listej[joueur]);
    }

    tourActuel = listeJoueurs[1];
}


function getCard(idCard, emplacement, joueur) {
    //affiche la carte du joueur à l'emplacement dans lequel elle se trouve
    for (var index = -1; index < CARDLIST.length; index++) {
        if (idCard == index) {
            //affichage conditionnel selon si c'est le joueur principal ou un adversaire qui a la carte
            //à régler car actuellement tout le monde voit tout au même endroit
            if (index == -1) {
                document.getElementById("player" + joueur[0] + "Card" + emplacement).style.background = "left / contain #FFFFFF url('" + NOCARD[1] + "') no-repeat";

                $("#player" + joueur[0] + "Card" + emplacement).html("[" + NOCARD[0] + "] " + NOCARD[2]);
                if (joueur[0] == 0) {
                    $("#playerCardDesc" + emplacement).html(NOCARD[3]);
                }
            } else {
                document.getElementById("player" + joueur[0] + "Card" + emplacement).style.background = "left / contain #FFFFFF url('" + CARDLIST[index][1] + "') no-repeat";

                $("#player" + joueur[0] + "Card" + emplacement).html("[" + CARDLIST[index][0] + "] " + CARDLIST[index][2]);
                if (joueur[0] == 0) {
                    $("#playerCardDesc" + emplacement).html(CARDLIST[index][3]);
                }
                break;
            }            
        }
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

function displayPioche(deckLength) {
    //visuellement mettre à jour le nombre de cartes dans le deck
    //document.getElementById("piocheNbCard").innerHTML = DECK.length;
    $("#piocheNbCard").html(deckLength);
}

function piocher() {
//envoie l'info au serveur que le joueur a pioché
//on vérifie que le joueur qui clique sur "piocher" est bien celui dont c'est le tour
    if (tourActuel[0] == idJoueurClient[0]) {
        socket.emit("piocher", document.getElementById("loginName").value);
    }
}

function jouer(emplacement) {
    //si le deck est vide on ne joue pas
    if (deckLength === 0) {
        alert("deck vide, partie finie");
        return 99;
    }

    //on vérifie que le joueur qui clique sur "jouer" est bien celui dont c'est le tour
    if (tourActuel[0] == idJoueurClient[0]) {

        idJC = idJoueurClient[0];
        //emplacement a la valeur 0 (gauche) ou 1 (droite) 
        if (listeDesJoueurs[idJC][2][emplacement][0] == NOCARD[0]) {
            alert("Vous n'avez aucune carte à jouer à cet emplacement.");
        }
        else {
            carteJouee = listeDesJoueurs[idJC][2][emplacement];

            //prise en compte de la sélection
            selectJC = document.getElementById("playSelectJoueur" + emplacement);
            joueurCible = selectJC.options[selectJC.selectedIndex].value;
            selectRC = document.getElementById("playSelectRole" + emplacement);
            roleCible = selectRC.options[selectRC.selectedIndex].value;

            //effet des cartes
            //idée : enlever les gens morts de la liste des gens vivants
            if (carteJouee == GARDE) {
                if (listeDesJoueurs[joueurCible][3] != SERVANTE && joueurCible != idJoueurClient[0] && listeDesJoueurs[joueurCible][1] == 1) {
                    //valider l'action
                    validerJouer(carteJouee, emplacement, joueurCible, roleCible);
                }

            } else if (carteJouee == PRETRE && joueurCible != "0") {
                validerJouer(carteJouee, emplacement, joueurCible, roleCible);

            } else if (carteJouee == BARON) {
                if (listeDesJoueurs[joueurCible][3] != SERVANTE && joueurCible != idJoueurClient[0] && listeDesJoueurs[joueurCible][1] == 1) {
                    //on valide le fait de jouer avant d'appliquer les effets du baron
                    validerJouer(carteJouee, emplacement, joueurCible, roleCible);
                }

            } else if (carteJouee == PRINCE) {
                if ((listeDesJoueurs[joueurCible][3] != SERVANTE && listeDesJoueurs[joueurCible][1] == 1) || joueurCible == idJoueurClient[0]) {
                    validerJouer(carteJouee, emplacement, joueurCible, roleCible);
                }

            } else if (carteJouee == CHANCELIER) {
                validerJouer(carteJouee, emplacement, joueurCible, roleCible);

            } else if (carteJouee == ROI) {
                if (listeDesJoueurs[joueurCible][3] != SERVANTE && listeDesJoueurs[joueurCible][1] == 1 && joueurCible != idJoueurClient[0]) {
                    validerJouer(carteJouee, emplacement, joueurCible, roleCible);
                }

                //la princesse est impossible à jouer
            } else if (carteJouee == PRINCESSE) { }

            else {
                validerJouer(carteJouee, emplacement, joueurCible, roleCible);
                //jouerIA(listeDesJoueurs[idJC]);
            }

            //verifier la victoire
            //hasWon(listeDesJoueurs);
        }
    }
}

function validerJouer(carteJouee, emplacement, joueurCible, roleCible) {
//envoie l'info au serveur que le joueur a joué
    console.log("Vous avez joué la carte " + carteJouee[2] + " avec le joueur ciblé " + joueurCible + " et le role ciblé " + roleCible);
    socket.emit('jouer', [document.getElementById("loginName").value, carteJouee, emplacement, joueurCible, roleCible]);

    //afficher une carte vide
    document.getElementById("player" + joueur[0] + "Card" + emplacement).style.background = "left / contain #FFFFFF url('" + NOCARD[1] + "') no-repeat";

    $("#player" + joueur[0] + "Card" + emplacement).html("[" + NOCARD[0] + "] " + NOCARD[2]);
    if (joueur[0] == 0) {
        $("#playerCardDesc" + emplacement).html(NOCARD[3]);
    }
}

function newGame(nbJoueurs) {
    socket.emit('startNewGame', nbJoueurs);
}

async function sendInfo() {
    $.post("/users", {
        name: document.getElementById("loginName").value
    })
        .done(function (data) {
            console.log(data);
        })

    socket.emit('register', document.getElementById("loginName").value);

    $("#deckTable").addClass("hidden");
    $("#chatDiv").removeClass("hidden");
}