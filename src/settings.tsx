import { useRecoilState } from "recoil";
import { apiKeyState, teamNameState } from "./state";
import { useEffect, useRef } from "preact/hooks";
import { invoke } from "@tauri-apps/api/tauri";
import { atom } from "recoil";
import { emit, once} from "@tauri-apps/api/event";

export const settingState = atom({
  key: "settingState",
  default: {
    api_key: "",
    team_name: "",
  },
});

export function Settings() {
  const [setting, setSetting] = useRecoilState(settingState);
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const teamNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emit("get-setting");
  }, []);

  useEffect(() => {
    const unlisten = once(
      "get-setting-callback",
      (event: { event: string, payload: string }) => {
        const payload = JSON.parse(event.payload);
        setSetting({ ...settingState, ...payload, open: false });
      }
    )
    return () => {
      unlisten.then((unlisten) => unlisten());
    };
  }, [setting]);

  const onSettingChange = (setting) => {
    if (!apiKeyRef.current || !teamNameRef.current) {
      return;
    }
    const nextSetting = { ...settingState, api_key: apiKeyRef.current.value, team_name: teamNameRef.current.value };
    emit("set-setting", nextSetting);
    setSetting(nextSetting);
    emit("get-setting");
  }
  return (
    <div>
      <input
        type="text"
        value={setting.api_key}
        ref={apiKeyRef}
        placeholder="API Key"
      />
      <input
        type="text"
        value={setting.team_name}
        ref={teamNameRef}
        placeholder="Team Name"
      />
      <button onClick={onSettingChange}>保存</button>
    </div>
  );
}

export default Settings;
