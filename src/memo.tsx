import { once, emit } from "@tauri-apps/api/event";
import { atom, useRecoilState } from "recoil";
import { useEffect } from "preact/hooks";
export const memoState = atom({
  key: "memoState",
  default: {
    memo: "",
    id: "",
    title: "",
    body: "",
    tags: "",
  },
});

export const memosState = atom({
  key: "memosState",
  default: [],
});

export function Memo() {
  // const [memo, setMemo] = useRecoilState(memoState);
  const [memos, setMemos] = useRecoilState(memosState);

  useEffect(() => {
    if (memos.length === 0) {
      emit("find-memo");
    }
  })

  useEffect(() => {
    const unlisten = once(
      "find-memo-callback",
      (event: { event: string; payload: string }) => {
        const payload = JSON.parse(event.payload);
        console.log(payload);
        setMemos([ ...memos, ...payload ]);
      }
    );

    console.log(memos)
    return () => {
      console.log("unlisten find-memo-callback");
      unlisten.then((unlisten) => unlisten());
    };
  }, [memos]);

  return (
    <div>

      <h1 class="text-  mt-3 font-clor underline">
        memo
      </h1>

      <span>{memos.length}</span>
      {memos && memos.map((memo, index) => (
        <div key={index}>
          <h3>{memo.title}</h3>
          {/* <p>{memo.body}</p> */}
        </div>
      ))}
    </div>
  );
}
