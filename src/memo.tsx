import { once, emit } from "@tauri-apps/api/event";
import { atom, useRecoilState } from "recoil";
import { useEffect, useState } from "preact/hooks";
import { createTheme, ThemeProvider, Section, SideNav } from 'smarthr-ui'
import 'smarthr-ui/smarthr-ui.css'
import Markdown from 'react-markdown'


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
  const [selectedTag, setSelectedTag] = useState('nikki');

  useEffect(() => {
    if (memos.length === 0) {
      emit("find-memo", { name: selectedTag });
    }
  })

  useEffect(() => {
    const unlisten = once(
      "find-memo-callback",
      (event: { event: string; payload: string }) => {
        const payload = JSON.parse(event.payload);
        console.log(payload);
        setMemos([ ...payload ]);
      }
    );
    return () => {
      console.log("unlisten find-memo-callback");
      unlisten.then((unlisten) => unlisten());
    };
  }, [memos]);

  useEffect(() => {
    console.log("hennkousaretayo");
    console.log(selectTag)
    console.log({name: selectedTag})
    console.log(JSON.stringify(selectedTag))
    emit("find-memo", { name: selectedTag })
  }, [selectedTag]);

  const selectTag = (event) => {
    console.log(event.currentTarget.innerText);
    setSelectedTag(event.currentTarget.innerText);
  }
  const navItems = [
    {
      id: 'nikki',
      title: 'nikki',
      isSelected: selectedTag === 'nikki',
    },
    {
      id: 'frappe',
      title: 'frappe',
      isSelected: selectedTag === 'frappe',
    },
    {
      id: 'dev',
      title: 'dev',
      isSelected: selectedTag === 'dev',
    },
    {
      id: 'チームトポロジー',
      title: 'チームトポロジー',
      isSelected: selectedTag === 'チームトポロジー',
    },

  ]

  // UI
  const theme = createTheme();

  return (
    <ThemeProvider theme={theme}>
      <div className="flex flex-wrap -mx-2">
        <div className="w-1/4 p-2 bg-gray-100 overflow-auto inset-y-0 left-0">
          <input type="text" className="mt-1 mb-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></input>
          <Section>
            <SideNav items={navItems} onClick={selectTag} />
          </Section>
        </div>
        <div className="w-3/4 px-2 mt-3 duration-300 overflow-auto">
          {memos && memos.map((memo, index) => (
            <div key={index}>
              <h3>{memo.title}</h3>
              {memo.id}
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                  {tag.name}
                </span>
              ))}
            </div>
          ))}

        </div>
      </div>
    </ThemeProvider>
  );
}
