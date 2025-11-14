import { ChangeEvent, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Camera, Loader2, Mic, SendHorizonal, UploadCloud } from "lucide-react";
import { api } from "@/lib/api";
import { useSpeech } from "@/hooks/useSpeech";

type MessageRole = "user" | "assistant" | "system";

type Message = {
  id: string;
  role: MessageRole;
  text: string;
  meta?: Record<string, unknown>;
};

const defaultPrompts = [
  "“List unassigned vehicles for the next trip”",
  "“Remove vehicle from Bulk - 00:01”",
  "“Create a new stop called West Gate”",
  "“Show me trips on this page”"
];

export const MoviAssistant = () => {
  const location = useLocation();
  const { transcript, setTranscript, speechState, startListening, speak } = useSpeech();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I’m Movi. I can help you manage routes, deployments and day-of operations. Ask me anything or upload a screenshot for visual lookup."
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [visionMatch, setVisionMatch] = useState<string | null>(null);

  const currentPage = useMemo(() => {
    if (location.pathname.includes("manageRoute")) return "manageRoute";
    return "busDashboard";
  }, [location.pathname]);

  const handleSubmit = async (prompt?: string, overridePayload?: ReturnType<typeof buildIntentPayload>) => {
    const text = prompt ?? input ?? transcript;
    if (!text.trim()) return;

    const intentPayload = overridePayload ?? buildIntentPayload(text, currentPage);
    setIsSending(true);
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTranscript("");

    try {
      const { data } = await api.agentAction(intentPayload);
      const assistantText = buildAssistantMessage(data);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: assistantText,
        meta: { ...data, intentPayload }
      };
      setMessages((prev) => [...prev, assistantMessage]);
      speak(assistantText);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          text: "Sorry, I ran into an issue talking to the backend."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceStart = () => {
    startListening();
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsSending(true);
    try {
      const { data } = await api.uploadScreenshot(file);
      setVisionMatch(data.match);
      const assistant = `I analysed the screenshot and ${data.match ? `found a reference to "${data.match}" with confidence ${(data.confidence * 100).toFixed(0)}%.` : "couldn't match it to a known trip."}`;
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: assistant }
      ]);
      speak(assistant);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "system", text: "Image analysis failed." }
      ]);
    } finally {
      event.target.value = "";
      setIsSending(false);
    }
  };

  return (
    <aside className="flex h-full flex-col rounded-2xl bg-white shadow-card">
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Movi Assistant</p>
            <p className="text-xs text-slate-400">
              Context: <span className="font-medium text-brand-500">{currentPage}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Mic className="h-3 w-3" /> {speechState === "listening" ? "Listening…" : "Voice"}
            </span>
            <span className="flex items-center gap-1">
              <Camera className="h-3 w-3" /> Vision
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {defaultPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={isSending}
              onClick={() => handleSubmit(prompt.replace(/“|”/g, ""))}
              className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left text-xs font-medium text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
            >
              {prompt}
            </button>
          ))}
        </div>
        {visionMatch && (
          <p className="mt-3 rounded-lg bg-brand-50 p-2 text-xs text-brand-600">
            Latest screenshot tagged trip: <span className="font-semibold">{visionMatch}</span>
          </p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-xl p-3 text-sm leading-relaxed ${
              message.role === "assistant"
                ? "bg-brand-50 text-brand-800"
                : message.role === "system"
                  ? "bg-red-50 text-red-700"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {message.text}
            {message.meta?.consequence && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                <p className="font-semibold">Heads up</p>
                <p>{(message.meta.consequence as any).reason}</p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-amber-600"
                  onClick={() => {
                    const intentPayload = (message.meta?.intentPayload as any) ?? {};
                    const confirmedPayload = {
                      ...intentPayload,
                      parameters: { ...intentPayload.parameters, confirmed: true }
                    };
                    handleSubmit("Confirm action", confirmedPayload);
                  }}
                >
                  Confirm and proceed
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-slate-100 p-4">
        {transcript && (
          <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50 p-2 text-xs text-brand-700">
            Voice input captured: <strong>{transcript}</strong>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a request…"
            className="h-11 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white"
            disabled={isSending}
          />
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSending}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-3 text-white shadow hover:bg-brand-600 disabled:bg-slate-300"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleVoiceStart}
            disabled={isSending}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-500 disabled:text-slate-300"
          >
            <Mic className="h-4 w-4" />
          </button>
          <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-500">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <UploadCloud className="h-4 w-4" />
          </label>
        </div>
      </div>
    </aside>
  );
};

const buildIntentPayload = (text: string, contextPage: string) => {
  const normalized = text.toLowerCase();
  const payload = {
    intent: "list_daily_trips",
    parameters: {} as Record<string, unknown>,
    context: { currentPage: contextPage }
  };

  if (normalized.includes("unassigned vehicles")) {
    payload.intent = "list_unassigned_vehicles";
  } else if (normalized.includes("trip status")) {
    payload.intent = "get_trip_status";
    payload.parameters.trip_name = extractTripName(text);
  } else if (normalized.startsWith("create stop") || normalized.includes("new stop")) {
    payload.intent = "create_stop";
    payload.parameters = {
      name: extractStopName(text) ?? "New Stop",
      latitude: 12.98,
      longitude: 77.59
    };
  } else if (normalized.includes("create path")) {
    payload.intent = "create_path";
    payload.parameters = {
      name: extractPathName(text) ?? "New Path",
      stop_ids: [1, 2, 3]
    };
  } else if (normalized.includes("create route")) {
    payload.intent = "create_route";
    payload.parameters = {
      path_id: 1,
      route_display_name: extractTripName(text) ?? "AI Route",
      shift_time: "09:00",
      direction: "Outbound",
      start_point: "Campus Gate",
      end_point: "Tech Park",
      status: "Scheduled"
    };
  } else if (normalized.includes("remove vehicle")) {
    payload.intent = "remove_vehicle_from_trip";
    payload.parameters = {
      trip_id: 1,
      trip_name: extractTripName(text) ?? "Bulk - 00:01"
    };
  } else if (normalized.includes("assign vehicle")) {
    payload.intent = "assign_vehicle_to_trip";
    payload.parameters = {
      trip_id: 1,
      vehicle_id: 1,
      driver_id: 1
    };
  } else if (normalized.includes("available drivers")) {
    payload.intent = "list_available_drivers";
  } else if (normalized.includes("deployments")) {
    payload.intent = "list_deployments";
  } else if (normalized.includes("routes using path")) {
    payload.intent = "list_routes_using_path";
    payload.parameters.path_name = extractPathName(text) ?? "North Loop";
  } else if (normalized.includes("stops for path")) {
    payload.intent = "list_stops_for_path";
    payload.parameters.path_name = extractPathName(text) ?? "North Loop";
  } else if (normalized.includes("status inactive") || normalized.includes("deactivate route")) {
    payload.intent = "update_route_status";
    payload.parameters = {
      route_id: 1,
      status: "Inactive",
      confirmed: normalized.includes("confirm")
    };
  } else if (normalized.includes("trips")) {
    payload.intent = "list_daily_trips";
  }

  return payload;
};

const buildAssistantMessage = (data: any) => {
  if (!data) return "Done.";
  if (data.consequence && !data.data) {
    return data.message;
  }
  return data.message ?? "Done.";
};

const extractTripName = (text: string) => {
  const match = text.match(/["“](.+?)["”]/);
  return match ? match[1] : null;
};

const extractStopName = (text: string) => {
  const match = text.match(/stop called ([A-Za-z\s]+)/i);
  return match ? match[1].trim() : null;
};

const extractPathName = (text: string) => {
  const match = text.match(/path(?: called)? ([A-Za-z\s]+)/i);
  return match ? match[1].trim() : null;
};

