/*
 * Node.js program to convert chess moves to gcode commands to be executed using GRBL
 * Sends commands via two serial ports
 *    moverPort: X-Y moves
 *    pickerPort: commands tpo
 */

import { SerialPort } from 'serialport';
import readline from 'readline';

const moverPort = new SerialPort({ path: 'COM4', baudRate: 115200, autoOpen: true});
const pickerPort = new SerialPort({ path: 'COM3', baudRate: 115200, autoOpen: true});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});



function sendMoverCommand(command: string) {
  moverPort.write(command + '\r\n', (err) => {
    if (err) {
      console.error('Error writing to picker serial port:', err);
    } else {
      console.log('Command sent:', command);
    }
  });
}

function sendPickerCommand(command: string) {
  pickerPort.write(command + '\r\n', (err) => {
    if (err) {
      console.error('Error writing to mover serial port:', err);
    } else {
      console.log('Command sent:', command);
    }
  });
}

function roundTo3Decimals(stepCount: number) {
  return parseFloat(stepCount.toFixed(3));
}

function convertChessMoveToGCode(chessMove: string):{
                                                      firstMoveGCodeCommand: string, 
                                                      firstMoveGCodeCommandWait: number, 
                                                      secondMoveGCodeCommand: string,
                                                      secondMoveGCodeCommandWait: number,
                                                      backToOriginGCodeCommand: string, 
                                                      backToOriginGCodeCommandWait: number,
                                                      }  
{
  const sourceSquare = chessMove.substring(0, 2);
  const targetSquare = chessMove.substring(2, 4);

  //** ORIGIN **/
  const originX = 0; // A - H direction (note: coordinates must be zero to seven)
  const originY = 7; // 1 - 8 direction (note: coordinates must be zero to seven)

  // Convert chess move coordinates to G-code coordinates
  const sourceX = sourceSquare.charCodeAt(0) - 'a'.charCodeAt(0);
  const sourceY = parseInt(sourceSquare.charAt(1)) - 1;
  const targetX = targetSquare.charCodeAt(0) - 'a'.charCodeAt(0);
  const targetY = parseInt(targetSquare.charAt(1)) - 1;


  //**   MOVE TO SOURCE POSTION **/
  // Calculate the G-code move distances in X and Y directions
  const fistMoveDeltaX = roundTo3Decimals((sourceX - originX) * 0.5); // each move is 0.5 steps
  const fistMoveDeltaY = roundTo3Decimals((sourceY - originY) * 0.5); // each move is 0.5 steps
  const firstMoveCommand = `G21 G91 G1 X${fistMoveDeltaX} Y${fistMoveDeltaY} F200`;

  let maxMove1: number = 0;
  if(Math.abs(sourceX - originX) >= Math.abs(sourceY - originY)){
    maxMove1 = Math.abs(sourceX - originX);
  }
  else {
    maxMove1 = Math.abs(sourceY - originY);
  }
  const firstWait = maxMove1 * 286; //286 milliseconds is how long it takes an axis to move one step 
  console.log('FIRST MOVE COMPLETE: ', firstMoveCommand);
  
  //**   MOVE TO TARGET POSTION **/
  const secondMoveDeltaX = roundTo3Decimals((targetX - sourceX) * 0.5); // each move is 0.5 steps
  const secondMoveDeltaY = roundTo3Decimals((targetY - sourceY) * 0.5); // each move is 0.5 steps
  const secondMoveCommand = `G21 G91 G1 X${secondMoveDeltaX} Y${secondMoveDeltaY} F200`;

  let maxMove2: number = 0;
  if(Math.abs(targetX - sourceX) >= Math.abs(targetY - sourceY)){
    maxMove2 = Math.abs(targetX - sourceX);
  }
  else {
    maxMove2 = Math.abs(targetY - sourceY);
  }
  const secondWait = maxMove2 * 286; //286 milliseconds is how long it takes an axis to move one step 
  console.log('SECOND MOVE COMPLETE: ', secondMoveCommand);

  //** MOVE TO ORIGIN POSTION **/
  const thirdMoveDeltaX = roundTo3Decimals((originX - targetX) * 0.5); // each move is 0.5 steps
  const thirdMoveDeltaY = roundTo3Decimals((originY - targetY) * 0.5); // each move is 0.5 steps
  const backToOriginCommand = `G21 G91 G1 X${thirdMoveDeltaX} Y${thirdMoveDeltaY} F200`;

  let maxMove3: number = 0;
  if(Math.abs(originX - targetX) >= Math.abs(originY - targetY)){
    maxMove3 = Math.abs(originX - targetX);
  }
  else {
    maxMove3 = Math.abs(originY - targetY);
  }
  const thirdWait = maxMove3 * 286; //286 milliseconds is how long it takes an axis to move one step 
  console.log('SECOND MOVE COMPLETE: ', secondMoveCommand);
  console.log('THIRD MOVE COMPLETE: ', backToOriginCommand);

  return {
          firstMoveGCodeCommand: firstMoveCommand, 
          firstMoveGCodeCommandWait: firstWait,
          secondMoveGCodeCommand: secondMoveCommand, 
          secondMoveGCodeCommandWait: secondWait,
          backToOriginGCodeCommand: backToOriginCommand,
          backToOriginGCodeCommandWait: thirdWait,
        }; // Returns Gcode Command as strings
}

// Prints when data is received from GRBL
pickerPort.on('data', (data) => {
  const grblResponse = data.toString();
  console.log('Data received on picker serial port:', grblResponse);
});

moverPort.on('data', (data) => {
  const grblResponse = data.toString();
  console.log('Data received on mover serial port:', grblResponse);
});

async function delay(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function promptForMove() {
  rl.question('Enter a chess move (e.g., "c2c4","d6d4","g1f3") or "quit" to exit: ', async (chessMove) => {
    if (chessMove === 'quit') {
      rl.close();
      pickerPort.close();
      moverPort.close();
      console.log('Program terminated');
    } 


    else {
      const chessMovesInfo:{firstMoveGCodeCommand: string, 
                            firstMoveGCodeCommandWait: number, 
                            secondMoveGCodeCommand: string,
                            secondMoveGCodeCommandWait: number,
                            backToOriginGCodeCommand: string, 
                            backToOriginGCodeCommandWait: number,
                            }  = convertChessMoveToGCode(chessMove);
      
      sendMoverCommand(chessMovesInfo.firstMoveGCodeCommand);
      await delay (chessMovesInfo.firstMoveGCodeCommandWait);
      sendPickerCommand('A_DOWN');
      await delay (1700);
      sendPickerCommand('M_ON');
      await delay (100);
      sendPickerCommand('A_UP');
      await delay (1700);

      sendMoverCommand(chessMovesInfo.secondMoveGCodeCommand);
      await delay (chessMovesInfo.secondMoveGCodeCommandWait);
      sendPickerCommand('A_DOWN');
      await delay (1700);
      sendPickerCommand('M_OFF');
      await delay (100);
      sendPickerCommand('A_UP');
      await delay (1700);

      sendMoverCommand(chessMovesInfo.backToOriginGCodeCommand);
      await delay (chessMovesInfo.backToOriginGCodeCommandWait);

      promptForMove();
    }
  });
}


promptForMove();

// Additional serial port event handlers
pickerPort.on('error', (err) => {
  console.error('Picker port serial error:', err);
});

pickerPort.on('close', () => {
  console.log('Picker port serial connection closed.');
});

moverPort.on('error', (err) => {
  console.error('Mover port serial error:', err);
});

moverPort.on('close', () => {
  console.log('Mover port serial connection closed.');
});
