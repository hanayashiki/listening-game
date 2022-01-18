import { useEffect, useRef, useState } from "react";
import { LoaderFunction, useLoaderData } from "remix";
import dotdotdotIcon from "~/assets/dotdotdot.svg";
import { TTSService } from "~/lib/TTSService";

const ttsService = new TTSService();

export const loader: LoaderFunction = async ({ request }) => {
  let url = new URL(request.url);
  const wordB64 = url.searchParams.get("word_b64");
  await ttsService.ensureAuthTokenValid();
  const answer = wordB64 ? window.atob(wordB64) : String(Math.floor(Math.random() * 10000));
  let speech = await ttsService.getSpeechBase64({ text: answer });
  return {
    answer,
    speech,
  };
};

export default function Index() {
  const {
    answer,
    speech,
  } = useLoaderData<Awaited<ReturnType<typeof loader>>>();

  const [answerInput, setAnswerInput] = useState('');
  const [played, setPlayed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (answerInput === answer) {
      setTimeout(() => {
        document.location.reload();
      }, 500);
    }
  }, [answerInput === answer]);

  return (
    <div className="mx-auto max-w-5xl flex flex-col h-full">
      <header className="h-12 px-4 flex flex-inline justify-end items-center">
        <img src={dotdotdotIcon} height={16} width={16} />
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
          {answerInput !== '' && (answerInput === answer ? <span className="text-green-400">正解です！</span> : <span className="text-red-500">誤答です〜</span>)}
          {played &&　answerInput === ''　&& <span className="text-primary">数字を聞いて入力してください</span>}
          {!played && <span className="text-primary">PLAYを押してください</span>}
        </div>
        <div className="pt-[200px] flex flex-col gap-y-8">
          <button
            className="bg-primary h-[50px] w-[160px] rounded-[25px] text-2xl text-white"
            onClick={async () => {              inputRef.current?.focus();
              const audio = new Audio(`data:audio/mpeg;base64,${speech}`);
              await audio.play();
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
