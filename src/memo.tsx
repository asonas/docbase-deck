import { once, emit } from "@tauri-apps/api/event";
import { atom, useRecoilState } from "recoil";
import { useEffect } from "preact/hooks";
import { createTheme, ThemeProvider, Section, SideNav } from 'smarthr-ui'
import 'smarthr-ui/smarthr-ui.css'


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
    return () => {
      console.log("unlisten find-memo-callback");
      unlisten.then((unlisten) => unlisten());
    };
  }, [memos]);

  // UI
  const theme = createTheme();

  return (
    <ThemeProvider theme={theme}>
      <div className="flex flex-col md:flex-row ">
        <div className="w-1/4 md:w-1/5 p-1">
          <input type="text" className="mt-1 mb-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></input>
          <Section>
            <SideNav items={[{ id: "nikki", title: "nikki", isSelected: true }, { id: "frappe", title: "frappe"}]} />
          </Section>
        </div>
        <div className="md:flex-1">
          {memos && memos.map((memo, index) => (
            <div key={index}>
              <h3>{memo.title}</h3>
              {/* <p>{memo.body}</p> */}
            </div>
          ))}

        </div>
      </div>
    </ThemeProvider>
  );
}
