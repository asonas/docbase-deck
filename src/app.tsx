import "tailwindcss/tailwind.css";
import { RecoilRoot } from "recoil";
import { Settings } from "./settings";
import { Memo } from "./memo";

export function App() {

  return (
    <RecoilRoot>
      <div>
        {/* <Settings></Settings> */}
        <Memo></Memo>
      </div>
    </RecoilRoot>
  );
}

export default App;

// import { invoke } from "@tauri-apps/api/tauri";

// let greetInputEl: HTMLInputElement | null;
// let greetMsgEl: HTMLElement | null;

// async function greet() {
//   if (greetMsgEl && greetInputEl) {
//     // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
//     greetMsgEl.textContent = await invoke("greet", {
//       name: greetInputEl.value,
//     });
//   }
// }

// window.addEventListener("DOMContentLoaded", () => {
//   greetInputEl = document.querySelector("#greet-input");
//   greetMsgEl = document.querySelector("#greet-msg");
//   document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
//     e.preventDefault();
//     greet();
//   });
// });
