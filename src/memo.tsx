import { once, emit } from "@tauri-apps/api/event";
import { atom, useRecoilState } from "recoil";
import { useEffect, useState, useRef } from "preact/hooks";
import { createTheme, ThemeProvider, Section, SideNav } from 'smarthr-ui'
import 'smarthr-ui/smarthr-ui.css'
import { open } from '@tauri-apps/api/shell';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Tag } from "./Tag";
import { readTextFile, writeFile } from '@tauri-apps/api/fs';
import { appDataDir } from '@tauri-apps/api/path';

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
  const [selectedTag, setSelectedTag] = useState('dev');
  const initialTags = [
    { id: 'dev', title: 'dev', isSelected: true },
    { id: 'nikki', title: 'nikki', isSelected: false },
    { id: 'frappe', title: 'frappe', isSelected: false },
    { id: 'チームトポロジー', title: 'チームトポロジー', isSelected: false }
  ];
  const [navItems, setNavItems] = useState(initialTags);
  const [newTagTitle, setNewTagTitle] = useState('');


  const [memos, setMemos] = useRecoilState(memosState);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTagIndex, setSelectedTagIndex] = useState(navItems.findIndex(item => item.id === selectedTag));
  const memoRefs = useRef([]);

  const TAGS_FILE_NAME = 'tags.json';
  const saveTagsToFile = async (tags) => {
    const path = await appDataDir();
      console.log(path);
    const fullPath = `${path}${TAGS_FILE_NAME}`;
    await writeFile({ path: fullPath, contents: JSON.stringify(tags) });
  };

  const loadTagsFromFile = async () => {
    try {
      const path = await appDataDir();
      console.log(path);
      const fullPath = `${path}${TAGS_FILE_NAME}`;
      const tagsJson = await readTextFile(fullPath);
      const tags = JSON.parse(tagsJson);
      setNavItems(tags);
    } catch (error) {
      if (error.code === 'NotFound') {
        console.log('tags.json not found. Saving initial tags.');
        setNavItems(initialTags);
        saveTagsToFile(initialTags).catch((saveError) =>
          console.error('Failed to save initial tags:', saveError)
        );
      } else {
        console.error('Failed to load tags:', error);
      }
    }
  };

  useEffect(() => {
    loadTagsFromFile();
  }, []);
  const markdownToHtml = (markdown) => {
    if (!markdown) return '';
    const rawMarkup = marked(markdown, { breaks: true });
    return DOMPurify.sanitize(rawMarkup);
  };

  const handleAddTagClick = () => {
    if (newTagTitle.trim() !== '') {
      handleAddTag(newTagTitle.trim());
      setNewTagTitle('');
    }
  };

  const handleSelectTag = (id) => {
    setSelectedTag(id);
    setNavItems(navItems.map(item => ({
      ...item,
      isSelected: item.id === id
    })));
  };

  const handleAddTag = async (newItemTitle) => {
    const newItem = {
      id: newItemTitle.toLowerCase(),
      title: newItemTitle,
      isSelected: false
    };
    if (!navItems.some(item => item.id === newItem.id)) {
      const newNavItems = [...navItems, newItem];
      setNavItems(newNavItems);
      await saveTagsToFile(newNavItems);
    }
  };

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

  const scrollToMemo = (index) => {
    const selectedMemo = memoRefs.current[index];
    if (selectedMemo) {
      selectedMemo.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  useEffect(() => {
    console.log(selectTag)
    console.log({name: selectedTag})
    console.log(JSON.stringify(selectedTag))
    emit("find-memo", { name: selectedTag })
  }, [selectedTag]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey) {
        let newTagIndex;
        switch (event.key) {
          case 'p':
            event.preventDefault();
            newTagIndex = Math.max(selectedTagIndex - 1, 0);
            setSelectedTagIndex(newTagIndex);
            handleSelectTag(navItems[newTagIndex].id);;
            setSelectedIndex(0);
            break;
          case 'n':
            event.preventDefault();
            newTagIndex = Math.min(selectedTagIndex + 1, navItems.length - 1);
            setSelectedTagIndex(newTagIndex);
            handleSelectTag(navItems[newTagIndex].id);
            setSelectedIndex(0);
            break;
        }
      } else {
        let newIndex;
        switch (event.key) {
          case 'k':
            newIndex = Math.max(selectedIndex - 1, 0);
            setSelectedIndex(newIndex);
            scrollToMemo(newIndex);
            break;
          case 'j':
            newIndex = Math.min(selectedIndex + 1, memos.length - 1);
            setSelectedIndex(newIndex);
            scrollToMemo(newIndex);
            break;
          case ';':
            handleOpenLink();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [memos, selectedIndex]);

  const handleOpenLink = async () => {
    if (memos && memos.length > 0) {
      await open(memos[selectedIndex].url);
    }
  };

  const selectTag = (event) => {
    console.log(event.currentTarget.innerText);
    setSelectedTag(event.currentTarget.innerText);
  }

  // UI
  const theme = createTheme();

  return (
    <ThemeProvider theme={theme}>
      <div className="flex mx-2">
        <div className="sticky top-1 w-/6 p-2 bg-gray-100 h-screen">
          <div className="flex flex-wrap -mx-3 mb-3">
            <div className="w-full md:w-5/5 px-1">
              <input
                type="text"
                placeholder="Add new tag"
                value={newTagTitle}
                onChange={(e) => setNewTagTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newTagTitle.trim() !== '') {
                    handleAddTagClick();
                  }
                }}
                className="appearance-none block w-full bg-gray-200 text-gray-700 border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
              />
            </div>
          </div>
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleSelectTag(item.id)}
              className={`text-left w-full px-4 py-2 rounded-lg text-sm font-semibold ${
                item.isSelected ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="w-2/6 px-2 mt-3 duration-300 overflow-auto h-screen">
          {memos && memos.map((memo, index) => (
            <div key={index}
                 ref={(el) => memoRefs.current[index] = el}
                 className={`p-4 mb-8 bg-white rounded-lg shadow-md border-4 ${index === selectedIndex ? 'border-blue-500' : 'border-transparent'}`} // 選択されているメモに枠線色を設定
                 onClick={() => {
                   setSelectedIndex(index);
                   scrollToMemo(index);
                 }}>
              <h3 className="mb-2 text-xl font-semibold text-gray-800">{memo.title}</h3>
              <div className="mb-4">
                {memo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 rounded-full px-3 py-1 text-sm font-semibold text-blue-700 mr-2 mb-2">
                    {tag.name}
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                公開日: {memo.created_at}
              </div>
              <div className="mt-2 flex items-center">
                <img
                  src={memo.user.profile_image_url}
                  alt="User"
                  className="w-8 h-8 rounded-full mr-2"
                />
                <div className="text-sm font-semibold">{memo.user.name}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="w-3/6 p-2 bg-gray-50 h-screen">
          {memos.length > 0 && (
            <div className="p-4 mb-8 bg-white rounded-lg shadow-md">
              <h3 className="mb-2 text-xl font-semibold text-gray-800">{memos[selectedIndex].title}</h3>
              <div className="mb-4">
                {memos[selectedIndex].tags.map((tag, index) => (
                  <span key={index} className="inline-block bg-blue-100 rounded-full px-3 py-1 text-sm font-semibold text-blue-700 mr-2 mb-2">
                    {tag.name}
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                公開日: {memos[selectedIndex].created_at}
              </div>
              <div className="mt-2 flex items-center">
                <img src={memos[selectedIndex].user.profile_image_url} alt="User" className="w-8 h-8 rounded-full mr-2" />
                <div className="text-sm font-semibold">{memos[selectedIndex].user.name}</div>
              </div>
              <div className="prose mt-4 text-gray-800 text-sm"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(memos[selectedIndex].body) }}>
              </div>
            </div>
          )}

        </div>
      </div>
    </ThemeProvider>
  );
}
