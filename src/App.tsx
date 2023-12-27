import "tailwindcss/tailwind.css";
import { RecoilRoot } from "recoil";
import { Settings } from "./settings";
import { Memo } from "./Memo";

export function App() {
  return (
    <RecoilRoot>
      <div className="bg-gray-100 h-full">
        <Settings></Settings>
        <Memo></Memo>
      </div>
    </RecoilRoot>
  );
}

export default App;
