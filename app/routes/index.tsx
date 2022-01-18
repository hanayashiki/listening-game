import { useEffect, useRef, useState } from "react";
import { LoaderFunction, useLoaderData } from "remix";
import dotdotdotIcon from "~/assets/dotdotdot.svg";
import { LocalStatisticsService } from "~/lib/LocalStatisticsService";
import { TTSService } from "~/lib/TTSService";

const ttsService = new TTSService();

const localStatistics = new LocalStatisticsService();

export const loader: LoaderFunction = async ({ request }) => {
  if (process.env.NODE_ENV === "development") {
    return {
      answer: "123",
      speech: "",
    };
  }
  let url = new URL(request.url);
  const wordB64 = url.searchParams.get("word_b64");
  await ttsService.ensureAuthTokenValid();
  const answer = wordB64
    ? window.atob(wordB64)
    : String(Math.floor(Math.random() * 10000));
  let speech = await ttsService.getSpeechBase64({ text: answer });
  return {
    answer,
    speech,
  };
};

function StatisticsDialog(props: { onClose: () => void }) {
  const { onClose } = props;

  const averageTime = localStatistics.getAverageTime();
  const count = localStatistics.getLogsCount();

  return (
    <div className="bg-black bg-opacity-90 fixed h-full w-full z-50 px-8 py-16 flex flex-col gap-y-4 text-white">
      <h1 className="text-xl">統計</h1>
      <div>平均時間(s)：{averageTime ? (averageTime / 1000).toFixed(2) : "-"}</div>
      <div>解答数：{count}</div>

      <div className="h-20" />

      <div>
        <button
          className="bg-white h-[50px] w-[160px] rounded-[25px] text-md text-black"
          onClick={() => {
            if (confirm("回答履歴を全て消してもよろしいですか？")) {
              localStatistics.clearAnswerLog();
              onClose();
            }
          }}
        >
          リセット
        </button>
      </div>

      <div>
        <button
          className="bg-white h-[50px] w-[160px] rounded-[25px] text-md text-black"
          onClick={onClose}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

export default function Index() {
  const { answer, speech } =
    useLoaderData<Awaited<ReturnType<typeof loader>>>();

  const [answerInput, setAnswerInput] = useState("");
  const [played, setPlayed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [timeStarted, setTimeStarted] = useState(0);
  const [timeCorrect, setTimeCorrect] = useState(0);

  const [statisticsDialogOpen, setStatisticsDialogOpen] = useState(false);

  const timeUsed = ((timeCorrect - timeStarted) / 1000).toPrecision(2);

  useEffect(() => {
    if (answerInput === answer && played) {
      localStatistics.saveAnswerLog({
        time: Date.now() - timeStarted,
        word: answer,
      });
      setTimeCorrect(Date.now());
      setTimeout(() => {
        document.location.reload();
      }, 300);
    }
  }, [answerInput, answer, played]);

  return (
    <div className="mx-auto max-w-5xl flex flex-col h-full">
      {statisticsDialogOpen && (
        <StatisticsDialog onClose={() => setStatisticsDialogOpen(false)} />
      )}

      <header className="h-14 px-4 flex flex-inline justify-end items-center">
        <img
          src={dotdotdotIcon}
          height={16}
          width={16}
          onClick={() => setStatisticsDialogOpen(true)}
        />
      </header>

      <article className="flex flex-1 flex-col items-center py-[100px]">
        <div className="border-b-primary border-b-2 py-1 text-primary">
          <input
            ref={inputRef}
            className="text-center bg-transparent text-3xl outline-none w-[200px]"
            type="number"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="h-12 text-center text-sm">
          {answerInput !== "" &&
            played &&
            (answerInput === answer ? (
              <span className="text-green-400">{timeUsed}秒で正解！</span>
            ) : (
              <span className="text-red-500">誤答です〜</span>
            ))}
          {played && answerInput === "" && (
            <span className="text-primary">数字を聞いて入力してください</span>
          )}
          {!played && (
            <span className="text-primary">PLAYを押してください</span>
          )}
        </div>
        <div className="pt-[200px] flex flex-col gap-y-8">
          <button
            className="bg-primary h-[50px] w-[160px] rounded-[25px] text-2xl text-white"
            onClick={async () => {
              inputRef.current?.focus();
              if (process.env.NODE_ENV === "production") {
                const audio = new Audio(`data:audio/mpeg;base64,${speech}`);
                await audio.play();
              }
              if (!played) {
                setTimeStarted(Date.now());
              }
              setPlayed(true);
            }}
          >
            PLAY
          </button>

          <button
            className="bg-white h-[50px] w-[160px] rounded-[25px] text-2xl text-primary"
            onClick={() => {
              document.location.reload();
            }}
          >
            SKIP
          </button>
        </div>
      </article>
    </div>
  );
}
