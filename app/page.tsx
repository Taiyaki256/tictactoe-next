"use client";
import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { Zen_Kaku_Gothic_New } from "next/font/google";

const Zen_Kaku_Gothic_NewFont = Zen_Kaku_Gothic_New({
  weight: "900",
  subsets: ["latin"],
});
let url =
  process.env.NEXT_PUBLIC_DEBUG === "true"
    ? "http://localhost:3000"
    : "https://websocket-deno.deno.dev";

function useSocket(url: string) {
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    console.log("connecting");
    const socket: Socket = io(url, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
    });

    setSocket(socket);

    return () => {
      console.log("disconnecting");
      socket.disconnect();
    };

    // should only run once and not on every re-render,
    // so pass an empty array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socket;
}

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(0);
  const [gameIndex, setGameIndex] = useState("");
  let socket = useSocket(url);
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
      const socketNum = sockets.length;
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
          setGame(gameInfo);
          socket?.emit("broadcast", gameInfo);
        }
      }
    }
    function onBroadcast(message: any, from: any) {
      console.log("on broadcast");
      console.log(message);
      if (gameState === 1) {
        setGameState(2);
        setGame(message);
      } else if (gameState === 2) {
        setGame(message);
      }
    }
    if (socket) {
      socket.on("connect", () => onConnect());
      socket.on("disconnect", () => onDisconnect());
      socket.on("error", (error) => onError(error));
      socket.on("joinSuccessful", (room, sockets) =>
        onJoinSuccessful(room, sockets)
      );
      socket.on("broadcast", (message, from) => onBroadcast(message, from));
    }
    return () => {
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
      socket?.off("error", onError);
      socket?.off("JoinSuccessful", (room, socketNum) =>
        onJoinSuccessful(room, socketNum)
      );
      socket?.off("broadcast", (message, from) => onBroadcast(message, from));
    };
  }, [gameState, socket]);

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

  return (
    <div className="game">
      {process.env.NEXT_PUBLIC_DEBUG === "true" ? "DEBUG MODE" : ""}
      <br />
      {connected ? "Connected" : "Disconnected"}
      <br />
      {gameState === 0 ? (
        <>
          <div className=" top-0 bottom-0 left-0 right-0 absolute w-1/3 m-auto h-min min-w-56 max-w-96">
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
              className="bg-blue-500 hover:bg-blue-700 text-white w-1/4 font-bold py-2 px-4 rounded"
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
          <div className="board">
            <div className={`turn ${Zen_Kaku_Gothic_NewFont.className}`}>
              {showTurn()}
            </div>
            <div className={`winner ${Zen_Kaku_Gothic_NewFont.className}`}>
              {showWinner()}
            </div>
            {[...Array(9)].map((_, i) => (
              <div key={i} className="cell" onClick={() => onCellClick(i)}>
                {board[i] === -1 ? (
                  ""
                ) : board[i] === 0 ? (
                  <div className="maru" />
                ) : (
                  <div className="batu" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
