import { once, emit } from '@tauri-apps/api/event';
import { atom, useRecoilState } from "recoil";
import { useEffect } from 'preact/hooks';
export const memoState = atom({
    key: "memoState",
    default: {
      memo: "",
      id: "",
      title: "",
      body: "",
      tags: ""

    },
});

export function Memo() {
  const [memo, setMemo] = useRecoilState(memoState);

  useEffect(() => {
    emit("find-memo");
  });

  useEffect(() => {
    const unlisten = once(
      "find-memo-callback",
      (event: { event: string, payload: string }) => {
        const payload = JSON.parse(event.payload);
        console.log(payload)
        setMemo({ ...memoState, ...payload, open: false });
      }
    )
    return () => {
      unlisten.then((unlisten) => unlisten());
    };
  }, [memo]);

  return (
    <div>
      Memo
    </div>
  );
}
