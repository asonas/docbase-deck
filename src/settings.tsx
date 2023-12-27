import { useRecoilState } from "recoil";
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

export const modalState = atom({
  key: "modalState",
  default: false,
});

function Modal({ onClose, onSettingChange, apiKeyRef, teamNameRef }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-10" id="my-modal">
      <div className="relative top-1/4 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">API Key & Team Name</h3>
          <div className="mt-2 px-7 py-3">
            <p className="text-sm text-gray-500">
              API KeyとTeam Nameを設定してください。
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              onSettingChange();
            }} className="mt-3">
              <input
                type="text"
                ref={apiKeyRef}
                placeholder="API Key"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <input
                type="text"
                ref={teamNameRef}
                placeholder="Team Name"
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <button
                type="submit"
                className="inline-flex justify-center mt-3 w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:text-sm"
              >
                保存
              </button>
            </form>
          </div>
          <div className="items-center px-4 py-3">
            <button onClick={onClose}
                    className="px-4 py-2 bg-white text-base rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const [setting, setSetting] = useRecoilState(settingState);
  const [isModalOpen, setIsModalOpen] = useRecoilState(modalState); // モーダルの状態を追加
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const teamNameRef = useRef<HTMLInputElement>(null);

  const onSettingChange = () => {
    if (!apiKeyRef.current || !teamNameRef.current) {
      return;
    }
    const nextSetting = {
      ...setting,
      api_key: apiKeyRef.current.value,
      team_name: teamNameRef.current.value
    };
    invoke('call_docbase_api', { apiKey: nextSetting.api_key, teamName: nextSetting.team_name })
      .then(response => {
        if (response.status === 200) {
          setIsModalOpen(false);
        }
      });

    emit("set-setting", nextSetting);
    setSetting(nextSetting);
  }

  useEffect(() => {
    emit("get-setting");
  }, []);

  useEffect(() => {
    setIsModalOpen(!setting.api_key || !setting.team_name);
  }, [setting.api_key, setting.team_name, setIsModalOpen]);

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

  return (
    <div>
      {isModalOpen && (
        <Modal
          onClose={() => setIsModalOpen(false)}
          onSettingChange={onSettingChange}
          apiKeyRef={apiKeyRef}
          teamNameRef={teamNameRef}
        />
      )}
    </div>
  );
}

export default Settings;
