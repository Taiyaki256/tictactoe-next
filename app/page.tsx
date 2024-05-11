"use client";
import { useEffect, useState } from "react";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import { motion } from "framer-motion";
import { socket } from "./socket";
import { BsCheckLg, BsExclamationTriangle } from "react-icons/bs";

const Zen_Kaku_Gothic_NewFont = Zen_Kaku_Gothic_New({
  weight: "900",
  subsets: ["latin"],
});

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(0);
  const [gameIndex, setGameIndex] = useState("");

  interface game {
    master: undefined | string;
    player: undefined | number;
    pin0: number[];
    pin1: number[];
    win: number;
  }
  const [game, setGame] = useState<game>({
    master: undefined,
    player: undefined,
    pin0: [],
    pin1: [],
    win: -1,
  });

  useEffect(() => {
    function onConnect() {
      console.log("connected");
      setConnected(true);
    }
    function onDisconnect() {
      console.log("disconnected");
      setConnected(false);
    }
    function onError(error: any) {
      console.log(error);
    }
    function onJoinSuccessful(room: any, sockets: any) {
      console.log(room);
      console.log(sockets);
      console.log(gameState);
      console.log("join successful");
      const socketNum = sockets.length;
      if (room === "end") {
        return;
      }
      if (room === "lobby") {
        setGameState(0);
        setGame({
          master: undefined,
          player: undefined,
          pin0: [],
          pin1: [],
          win: -1,
        });
        return;
      }
      if (socketNum > 2) {
        window.location.reload();
      }
      if (gameState === 0) {
        if (socketNum === 1) {
          //一人目だったら、待機
          setGameState(1);
        } else if (socketNum === 2) {
          //二人目だったら
          setGameState(2);
          let gameInfo: game = {
            master: socket?.id,
            player: 0, //0: master 1: another
            pin0: [],
            pin1: [],
            win: -1,
          };
          // setGame(gameInfo);
          socket?.emit("broadcast", gameInfo);
        }
      }
    }
    function onBroadcast(message: any, from: any) {
      console.log("on broadcast");
      console.log(message);
      console.log(from);
      console.log(gameState);
      if (gameState === 1) {
        setGameState(2);
        setGame(message);
      } else if (gameState === 2) {
        setGame(message);
      }
    }
    if (socket) {
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("error", onError);
      socket.on("joinSuccessful", onJoinSuccessful);
      socket.on("broadcast", onBroadcast);
    }
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onError);
      socket.off("joinSuccessful", onJoinSuccessful);
      socket.off("broadcast", onBroadcast);
    };
  }, [gameState]);

  function checkWin(pin0: number[], pin1: number[]) {
    let board = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
    pin0.forEach((pin) => {
      board[pin] = 0;
    });
    pin1.forEach((pin) => {
      board[pin] = 1;
    });
    // vertically
    let winner = -1;
    for (let i = 0; i < 3; i++) {
      let p0 = 0;
      let p1 = 0;
      for (let j = 0; j < 3; j++) {
        if (pin0.findIndex((a) => a === i + j * 3) !== -1) p0++;
        if (pin1.findIndex((a) => a === i + j * 3) !== -1) p1++;
      }
      if (p0 === 3) winner = 0;
      if (p1 === 3) winner = 1;
    }
    // horizontal
    for (let i = 0; i < 3; i++) {
      let p0 = 0;
      let p1 = 0;
      for (let j = 0; j < 3; j++) {
        if (pin0.findIndex((a) => a === i * 3 + j) !== -1) p0++;
        if (pin1.findIndex((a) => a === i * 3 + j) !== -1) p1++;
      }
      if (p0 === 3) winner = 0;
      if (p1 === 3) winner = 1;
    }
    // naname
    let ch = [0, 4, 8, 2, 4, 6];
    for (let i = 0; i < 2; i++) {
      let p0 = 0;
      let p1 = 0;
      for (let j = 0; j < 3; j++) {
        if (pin0.findIndex((a) => a === ch[i * 3 + j]) !== -1) p0++;
        if (pin1.findIndex((a) => a === ch[i * 3 + j]) !== -1) p1++;
      }
      if (p0 === 3) winner = 0;
      if (p1 === 3) winner = 1;
    }
    return winner;
  }

  function onCellClick(num: number) {
    console.log(num);
    if (gameState === 2) {
      let check = game.pin0.findIndex((pin) => {
        return pin === num;
      });
      if (check !== -1) return;
      check = game.pin1.findIndex((pin) => {
        return pin === num;
      });
      if (check !== -1) return;
      if (game.win !== -1) return;
      if (game.master === socket?.id) {
        if (game.player === 0) {
          let mypin = game.pin0;
          mypin.push(num);
          if (mypin.length > 3) {
            mypin.shift();
          }

          let gameInfo = {
            master: game.master,
            player: 1,
            pin0: mypin,
            pin1: game.pin1,
            win: checkWin(mypin, game.pin1),
          };
          socket?.emit("broadcast", gameInfo);
        }
      } else {
        if (game.player === 1) {
          let mypin = game.pin1;
          mypin.push(num);
          if (mypin.length > 3) {
            mypin.shift();
          }

          let gameInfo = {
            master: game.master,
            player: 0,
            pin0: game.pin0,
            pin1: mypin,
            win: checkWin(game.pin0, mypin),
          };
          socket?.emit("broadcast", gameInfo);
        }
      }
    }
    return;
  }
  function showTurn() {
    if (game.master === undefined) return "対戦相手を待っています";
    if (game.master === socket?.id) {
      if (game.player === 0) {
        return "あなたのターンです";
      } else {
        return "相手のターンです";
      }
    } else if (game.master !== socket?.id) {
      if (game.player === 1) {
        return "あなたのターンです";
      } else {
        return "相手のターンです";
      }
    }
  }
  function showWinner() {
    if (gameState === 2) {
      if (game.win === 0 || game.win === 1) {
        setGameState(3);
        socket?.emit("join", `end`);
      }
    }
    if (game.win === 0) {
      if (game.master === socket?.id) {
        return (
          <>
            あなたの勝利です！
            <br />
          </>
        );
      } else {
        return (
          <>
            対戦相手の勝利です....
            <br />
          </>
        );
      }
    } else if (game.win === 1) {
      if (game.master === socket?.id) {
        return (
          <>
            対戦相手の勝利です....
            <br />
          </>
        );
      } else {
        return (
          <>
            あなたの勝利です！
            <br />
          </>
        );
      }
    }
    return <></>;
  }
  let board = [-1, -1, -1, -1, -1, -1, -1, -1, -1];
  game.pin0.forEach((pin) => {
    board[pin] = 0;
  });
  game.pin1.forEach((pin) => {
    board[pin] = 1;
  });
  const titleword = "マルバツゲーム";
  titleword.split;
  return (
    <motion.div className="game">
      <span className="text-pretty ">
        {process.env.NEXT_PUBLIC_DEBUG === "true" ? (
          <>
            DEBUG MODE
            <br />
          </>
        ) : (
          <></>
        )}
        {/* {connected ? "Connected" : "Disconnected"} */}
        {connected ? (
          <>
            <BsCheckLg className="pl-2 pt-2 text-green-500" size={40} />
          </>
        ) : (
          <>
            <BsExclamationTriangle
              className="pl-2 pt-2 text-orange-400"
              size={40}
            />
          </>
        )}
      </span>
      <br />
      {gameState === 0 ? (
        <>
          <div
            className={`top-0 bottom-1/2 left-0 right-0 absolute m-auto text-pretty text-pink-500 max-h-min text-center font-bold text-5xl md:text-7xl ${Zen_Kaku_Gothic_NewFont.className}`}
          >
            {titleword.split("").map((word, index) => {
              return (
                <motion.span
                  className=" drop-shadow-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  key={index}
                >
                  {word}
                </motion.span>
              );
            })}
          </div>
          <div className="top-0 bottom-0 left-0 right-0 absolute w-1/3 m-auto h-min min-w-56 max-w-96">
            <div
              className={`text-center font-bold text-3xl mb-2 ${Zen_Kaku_Gothic_NewFont.className}`}
            >
              ルーム番号
            </div>
            <input
              className="shadow appearance-none border rounded w-3/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="room number"
              value={gameIndex}
              onChange={(e) => {
                setGameIndex(e.target.value);
              }}
            />
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white w-1/4 font-bold py-2 px-4 rounded
              shadow-sm shadow-blue-400"
              onClick={() => {
                console.log("joining " + gameIndex);
                socket?.emit("join", `tictactoe-${gameIndex}`);
              }}
            >
              join
            </button>
          </div>
        </>
      ) : (
        <>
          {game.win === -1 ? (
            ""
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: "easeInOut", duration: 0.4 }}
                className={`winner text-5xl ${Zen_Kaku_Gothic_NewFont.className}`}
              >
                {showWinner()}
              </motion.div>

              <button
                className="top-0 bottom-0 left-0 right-0 absolute max-w-min max-h-max z-10 text-2xl   m-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl font-mono drop-shadow-lg shadow-lg"
                onClick={() => {
                  console.log("OK");
                  socket?.emit("join", `lobby`);
                }}
              >
                Retry
              </button>
            </>
          )}
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: "easeInOut", duration: 0.4 }}
            className="board
            rounded-md border border-gray-200/30 shadow-lg"
          >
            <div
              className={`turn ${Zen_Kaku_Gothic_NewFont.className}  max-h-24`}
            >
              あなたは
              {game.master === socket?.id ? (
                <span className="text-red-500">○</span>
              ) : (
                <span className="text-indigo-500">x</span>
              )}
              です
              <div className="turntext w-full mb-2 text-center">
                {showTurn()}
              </div>
            </div>
            {[...Array(9)].map((_, i) => (
              <div key={i} className="cell" onClick={() => onCellClick(i)}>
                {board[i] === -1 ? (
                  ""
                ) : board[i] === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ease: "easeInOut", duration: 0.4 }}
                    className="maru"
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ease: "easeInOut", duration: 0.4 }}
                    className="batu"
                  />
                )}
              </div>
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
