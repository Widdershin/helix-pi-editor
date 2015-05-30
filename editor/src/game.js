
/**
* The core HelixPiEditor game file.
* 
* This file is only used to initalise (start-up) the main Kiwi Game 
* and add all of the relevant states to that Game.
*
*/

//Initialise the Kiwi Game. 


var gameOptions = {
	renderer: Kiwi.RENDERER_CANVAS, 
	width: 800,
	height: 600
}

var game = new Kiwi.Game('content', 'HelixPiEditor', null, gameOptions);

//Add all the States we are going to use.
game.states.addState(HelixPiEditor.Loading);
game.states.addState(HelixPiEditor.Intro);
game.states.addState(HelixPiEditor.Play);
game.states.addState(HelixPiEditor.Editor);

game.states.switchState("Loading");
