//costanti di riferimento
var FPS=60;
var keyPress;
var LEFT=37;
var RIGHT=39;
var UP=38;
var DOWN=40;
var dimGame=3000;
var velocitaInizialePlayer=5;
var game=null;
var socket = io();
var frameRate=1000/FPS;
var inizia = function(){
	nomeGiocatore=document.getElementById("txtNome").value
	var spritename="./img/giocatore.png";
	if(document.getElementById("img-2").checked)
		spritename="./img/giocatore2.png";
	if(document.getElementById("img-3").checked)
		spritename="./img/giocatore3.png";
	if(document.getElementById("img-4").checked)
		spritename="./img/giocatore4.png";
	if(document.getElementById("img-5").checked)
		spritename="./img/giocatore5.png";
	if(nomeGiocatore!="")
	{
	document.getElementById("btnInizia").disabled = true;
	document.getElementById("txtNome").disabled = true;
	game.player.name=nomeGiocatore;
	game.player.sprite.src=spritename;
	game.player.id=socket.id;//assegno un id al player
		//comunico al server 
	msgJson={name:game.player.name,id:game.player.id,x:game.player.x,y:game.player.y, width:game.player.width,wmax:game.player.wmax, velocita:game.player.velocita, alive:game.player.alive, xLocal:game.player.xLocal, yLocal:game.player.yLocal, score:game.player.score, home:game.player.home};
	socket.emit('newPlayer',msgJson);//comunico al server il nuovo player (mi serve per farlo sapere a tutti in broadcast)
	game.start();	
	}
	else
		alert("Inserire il nome del giocatore (max 6 caratteri)");
}
window.onload = function(){
	//aggiungo gli ascoltatori al window per gestire l'evento del tasto premuto
		window.addEventListener('keydown', function (e) {
			keyPress = e.keyCode;
			
        });
        window.addEventListener('keyup', function (e) {
			keyPress = false;
           });		
		game=new Game();	
		//creo un nuovo giocatore 
		//posizionato al centro 
		wperc=45;
		game.player=new Player({x:game.canvas.width/2.0-wperc/2.0,y:game.canvas.height/2.0-wperc/2.0,width:wperc, wmax:wperc+wperc*0.7});
		game.player.home=new Home({x:game.player.x,y:game.player.y,width:game.player.width});
		game.radar=new Radar();
		}
//======================================================================
//oggetto Game che contiene l'insieme del gioco
//======================================================================
var Game = function(json){
	this.sprite=new Image();
	this.sprite.src="./img/sfondo.png";
	this.enemies=[];
	this.otherPlayers=[];
	this.actions=[]; //azioni del player
	this.nComand=0;// n. del comando inviato al server
	this.player=null;
	this.radar=null;
	this.canvas = document.querySelector("#gameCanvas");
	this.ctx = this.canvas.getContext("2d");
	this.ctx.strokeStyle = "#CE9E00";
	this.ctx.fillStyle = "white";
	this.ctx.font="20px Oswald, sans-serif";
	this.width = dimGame;
	this.height= dimGame;
	this.x=0.0;
	this.y=0.0;
	this.xVis=0.0
	this.yVis=0.0
	this.startMoveX=this.canvas.width/2;
	this.endMoveX=this.width-this.canvas.width/2;
	this.startMoveY=this.canvas.height/2;
	this.endMoveY=this.width-this.canvas.height/2;
	this.debug=0;
	this.started=false;//indica se il gioco è iniziato, se non è iniziato il client NON deve rispondere ad alcuni Messaggi del server
	this.init(json);
	}
//======================================================================
Game.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}
//======================================================================
Game.prototype.start = function(){
	this.score=0;
	this.started=true;
	this.loop();
}
//======================================================================
Game.prototype.loop=function()
{
	
	//il client esegue solo l'update (del player)
	//e il display dei componenti 
	//la logica del gioco (il controllo delle collisioni) è tutta nel server
	//================================================
	this.update();
	this.display();
	//================================================
	
	//in javascript questa che segue permette di ripetere questa funzione ogni 1000/FPS secondi
	//cioè realizza il ciclo entro chi inserire le azioni di gioco finchè il giocatore è ancora in vita
	var self = this;
	if(this.player.alive)
	{
	setTimeout(function(){
			self.loop();
		}, frameRate);
	}
}
//======================================================================
Game.prototype.display = function(){
	
	this.ctx.save();
	//pulisce l'area di disegno
	this.ctx.clearRect(0, 0, this.width, this.height);
	//disegna lo sfondo
	this.ctx.drawImage(this.sprite, this.xVis, this.yVis, this.width,this.height);
	//disegna il radar
	this.radar.display();
	//disegna il player
	this.player.display();
	//disegna la home (solo di questo player)
	this.player.home.display();
	//disegna altri Player
	for(var i=0;i<this.otherPlayers.length;i++)
	{
		this.otherPlayers[i].display();
	}
	//disegna i nemici
	for(var i=0;i<this.enemies.length;i++)
	{
		this.enemies[i].display();
	}
	//disegno lo score a video
	this.ctx.fillText("Score : "+ this.player.score, 10, 25);
	this.ctx.fillText("Live : "+this.player.numOfLive, 10, 50);
	if(this.player.alive==false)this.ctx.fillText("Game Over!!", 10, 75);
	this.ctx.restore();
	}
//======================================================================
Game.prototype.update=function(){
	//aggiorno il giocatore
	this.player.update();
	//aggiorno lo sfondo in funzione della posizione del player
	//======================================================================
						if(game.player.x>game.startMoveX&&game.player.x<game.endMoveX)
							game.xVis=game.startMoveX-game.player.x;
						else{
							if(game.player.x<=game.startMoveX)
								game.xVis=0.0
							else
								game.xVis=game.startMoveX-game.endMoveX
							}
						if(game.player.y>game.startMoveY&&game.player.y<game.endMoveY)
							game.yVis=game.startMoveY-game.player.y;
						else{
							if(game.player.y<=game.startMoveY)
								game.yVis=0.0
							else
								game.yVis=game.startMoveY-game.endMoveY
							}
	//==========================================================================
	
	if(this.player.numOfLive<=0)
	{
		this.player.alive=false; //player morto
		socket.emit('diePlayer',game.player.id);//comunico al server la morte del player
		this.started=false; //finito il gioco per questo cliente
	}
}
//======================================================================
//=========================================
// player
//=========================================
var Player=function(json)
{
	this.sprite=new Image();
	this.sprite.src="./img/giocatore.png";
	this.name=null;
	this.id=0;//da assegnare in fase di istanziazione nel server
	//valori di base
	this.x = 80;
	this.y = 250;
	this.score=0; //punteggio del player
	this.width = 40; //da definire in fase di istanziazione, non c'è height perchè quadrato
	this.wmax=0;//da definire in fase di istanziazione
	this.velocita=velocitaInizialePlayer;
	this.numOfLive=5;
	this.home;//mi servirà per lìoggetto Home, casa natale del player
	this.alive = true;
	//eventuali valori aggiornati con la new Player
	this.init(json);
}
//======================================================================
Player.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}
//=======================================================================
Player.prototype.update=function(){
	if(keyPress!=false)
	{
	
	//=================================================================================
	// prediction
	// aggiorno la x,y reale del player e comunico la posizione a tutti gli altri client.
	// a causa del delay del server, la mia posizione nel client sarà leggermente avanti
	// rispetto a quella nel server
	//=================================================================================
	if(keyPress==LEFT&&(this.x-this.velocita)>0)
				this.x=this.x-this.velocita;
	if(keyPress==RIGHT&&(this.x+this.velocita)<(game.width-this.width))
		this.x=this.x+this.velocita;
	if(keyPress==UP&&(this.y-this.velocita)>0)
				this.y=this.y-this.velocita;
	if(keyPress==DOWN&&(this.y+this.velocita)<(game.height-this.width))
		this.y=this.y+this.velocita;
	
	//Memorizzo comunquw licalmente tutti i comandi che ho inviato al server
	//inquesto modo quando il server mi comunica in modo autoritativo la mia posizione 
	//reale posso elaborarla e agire di conseguenza
	//vedi predection in http://www.gabrielgambetta.com/client-server-game-architecture.html
	game.nComand++; //id dell'azione che ho appena compiuto (numero sequenziale)
	//aggiorno il server con i nuovi dati della posizione
	msgJson={nc:game.nComand,id:this.id,x:this.x,y:this.y};
	game.actions.push(msgJson);//memorizzo la sequenza di comandi
	socket.emit('updatePlayer',msgJson);
	}
}
//=======================================================================
Player.prototype.display=function(){
	game.ctx.save();
	posx=this.x+game.xVis;
	posy=this.y+game.yVis;
	game.ctx.drawImage(this.sprite,posx,posy,this.width,this.width);
	game.ctx.fillText(""+ this.name, posx+this.width/2, posy+this.width);
	game.radar.ctx.fillStyle = "red";
	game.radar.ctx.fillRect(this.x*game.radar.width/dimGame, this.y*game.radar.height/dimGame, 2,2);
	game.ctx.restore();
}
//=========================================
// Enemy
//=========================================
var Enemy=function(json){
	this.sprite=new Image();
	this.sprite.src="./img/nemico.png";
	//valori di base
	this.x = 80;
	this.y = 0;
	this.width = 40;
	this.velocita=1;
	this.alive = true;
	//eventuali valori aggiornati con la new Player
	this.init(json);
	
}
//======================================================================
Enemy.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}
//=======================================================================
Enemy.prototype.display=function(){
	game.ctx.save();
	posx=this.x+game.xVis;
	posy=this.y+game.yVis;
	game.ctx.drawImage(this.sprite,posx,posy,this.width,this.width);
	game.radar.ctx.fillStyle = "navy";
	game.radar.ctx.fillRect(this.x*game.radar.width/dimGame, this.y*game.radar.height/dimGame, 2,2);
	game.ctx.restore();
}
//=========================================
// radar
//=========================================
var Radar=function(json)
{
	this.canvas = document.querySelector("#gameRadar");
	this.ctx = this.canvas.getContext("2d");
	this.ctx.strokeStyle = "#CE9E00";
	this.ctx.font="20px Oswald, sans-serif";
	this.width = this.canvas.width;
	this.height= this.canvas.height;
	//eventuali valori aggiornati con la new Player
	this.init(json);
}
//======================================================================
Radar.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}
//======================================================================
Radar.prototype.display = function(){
	//pulisce l'area di disegno
	this.ctx.save();
	this.ctx.clearRect(0, 0, this.width, this.height);
	//disegna lo sfondo
	this.ctx.fillStyle = "#09fb2b";
	this.ctx.fillRect(0, 0, this.width,this.height);
	this.ctx.restore();
	}
//=========================================
// Home
//=========================================
var Home=function(json){
	this.sprite=new Image();
	this.sprite.src="./img/home.png";
	//valori di base
	this.x ;
	this.y ;
	this.width = 40;
	//eventuali valori aggiornati con la new Player
	this.init(json);
}
//======================================================================
Home.prototype.init = function(json){
	for(var i in json){
		this[i] = json[i];
	}
}
//=======================================================================
Home.prototype.display=function(){
	game.ctx.save();
	posx=this.x+game.xVis;
	posy=this.y+game.yVis;
	game.ctx.drawImage(this.sprite,posx,posy,this.width,this.width);//disegno la home
	game.ctx.restore();
}
//=========================================================================================
// EVENTI da SERVER
//=========================================================================================
socket.on('updateClient',function(o){
	if(game.started==true)
	{
	var objs=[];
	var objActions=[];
	
	objs = JSON.parse( o.p ); //riprendo il vettore serializzato dei Players
	objActions=JSON.parse(o.a);//riprendo il vettore delle azioni
	//===============================================
	//aggiorno i player
	//=============================================
			
				for(var i=0;i<objs.length;i++)
				{
					if(game.player.id==objs[i].id)
					{   
						//secondo la tecnica predection dovrei:
						// 1-cercare l'azione che mi è arrivata dal server
						// 2-cercare tra le azioni del client la medesima azione (stesso id)
						// 3-cancellare dal client tutte le azioni fino a questa
						// 4-ripetere nel cliente tutte le azioni locali rimanenti
						// nel mio caso (che uso un solo loop nel client per leggere le azioni (bottoni premuti) e applicarle (spostamento))
						// il punto 4 è ridondante e quinid non lo faccio
						// se avessi avtuo due loop a diversa frequenza, uno, a frequenza maggiore, per leggere le azioni ed un secondo,
						// a freqeunza minore, per applicarle, allora avrei dovuto fare anche il punto 4
						// tutto questo per rendere comunque il server auotitativo, cioè la verità sulle posizioni degli oggetti in gioco
						// è solo quella del server.
						var lastActionFromServer=0;
						for(var k=0;k<objActions.length;k++)
							{
								if(objActions[k].id==game.player.id)
									lastActionFromServer=objActions[k].nc;
							}
						if(lastActionFromServer!=0)
							{
								//vado ad eliminare dall'elenco delle azioni attuali, tutte quelle processate dal server
								var IndexAction=-1;
								for(var k=0;k<game.actions.length;k++)
									{
										if(lastActionFromServer==game.actions[k].nc)
											IndexAction=k;
									}
									if(IndexAction>=0)
										game.actions.splice(0,IndexAction);
									else
									{
										//pericolo di hacking: ho individuato un'azione del servere per questo player (lastActionFromServer<>0)
										//ma nel client tale azione non esiste why??
										//siccome il server è autoritativo assegno a x,y la posizione che mi arriva dal server
										game.player.x=objs[i].x;
										game.player.y=objs[i].y;
									}
									
							}
							//N.B. gli attribuit seguenti del palyer sono aggiornate dal servere senza PREDIZIONE
							//in questo caso il server è autoritativo completamente
						game.player.width=objs[i].width;
						game.player.velocita=objs[i].velocita;
						game.player.numOfLive=objs[i].numOfLive;
						game.player.score=objs[i].score;
						
					}
					else 
						{
							//aggiorno uno degli altri player
							trovato=0;
							for(var j=0;j<game.otherPlayers.length&&trovato==0;j++)
							{
								if(game.otherPlayers[j].id==objs[i].id)
									{
										game.otherPlayers[j].x=objs[i].x;
										game.otherPlayers[j].y=objs[i].y;
										game.otherPlayers[j].width=objs[i].width;
										game.otherPlayers[j].velocita=objs[i].velocita;
										game.otherPlayers[j].numOfLive=objs[i].numOfLive;
										game.otherPlayers[j].score=objs[i].score;
										trovato=1;
									}
							}
							
						}
				}
			//==================================================
			// aggiorno gli enemies locali
			//==================================================
			objs = JSON.parse( o.e ); //riprendo il vettore serializzato degli enemies
			var tot=game.enemies.length;
			if(tot>0)game.enemies.splice(0,tot);//vuoto il vettore
			for(var i=0;i<objs.length;i++)
				{
					ene=new Enemy({x:objs[i].x,y:objs[i].y,width:objs[i].width,velocita:objs[i].velocita,alive:objs[i].alive});
					game.enemies.push(ene);
				}
	}//fine if(game.started==true)
				
});

socket.on('newPlayerForOther',function(o){
	if(game.started==true)
	{
	var objs=[];
	
	objs = JSON.parse( o.p ); //riprendo il verrore serializzato
	//aggiorno otherplayer
	//1-azzero il vettore degli otherPlayer
	//2-ricreo l'intero vettore aggiungendo tutti i players in gioco tranne il presente
	// fase 1
	if(game.otherPlayers.length>0)
		game.otherPlayers.splice(0,game.otherPlayers.length);//azzero il vettore
				//fase 2
				for(var i=0;i<objs.length;i++)
				{if(game.player.id!=objs[i].id)
					{  console.log("game.player.it="+game.player.id+" objs.id="+objs[i].id);
						//quando creo gli otherPlayer non metto tutte le informazioni, ad esempio non metto Home,non mi serve
						p=new Player({id:objs[i].id,name:objs[i].name,x:objs[i].x,y:objs[i].y,velocita:objs[i].velocita,width:objs[i].width,alive:objs[i].alive});
						game.otherPlayers.push(p);
					}
				}
	}
});

socket.on('diePlayerForOther',function(idp){
	
	//aggiorno otherplayer
				trovato=0;
				for(var i=0;i<game.otherPlayers.length&&trovato==0;i++)
				{
					if(game.otherPlayers[i].id==idp)
				{
					game.otherPlayers.splice(i,1);//tolgo dal vettore
					i--;
					trovato=1
				}
				}
	
});
				
socket.on('diePlayerForIt',function(idp){
	
	//aggiorno questoplayer a cui comunico la morte certificata nel server per contatto con altro player
	if(game.player.id==idp)
	{
		game.player.numOfLive=0;
	}
				
});

