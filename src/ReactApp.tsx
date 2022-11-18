import { CheckIcon, ClipboardCopyIcon, Cross1Icon } from "@radix-ui/react-icons";
import { Notice, TextAreaComponent } from "obsidian";
import * as React from "react";
import { useObsidianApp } from "./AppContext";
import { feedback, GenerateResponse } from "./humanloop";
import { GenerationEvents } from "./main";

const useListener = (eventName: string, handler: (event: Event) => void) => {
  React.useEffect(() => {
    window.addEventListener(eventName, handler, false);
    return () => {
      window.removeEventListener(eventName, handler, false);
    };
  }, []);
};

export const ResponseArea = () => {
  // Could potentially handle these differently... that's why they're separate atm.
  const handleExtend = (event: CustomEvent) => {
    console.log({ event });
    setActiveMode(GenerationEvents.Extend);
    setResponse(event.detail);
  };
  const handleSummarize = (event: CustomEvent) => {
    console.log({ event });
    setActiveMode(GenerationEvents.Summarize);
    setResponse(event.detail);
  };
  const handleCritique = (event: CustomEvent) => {
    console.log({ event });
    setActiveMode(GenerationEvents.Critique);
    setResponse(event.detail);
  };
  const handleProseify = (event: CustomEvent) => {
    console.log({ event });
    setActiveMode(GenerationEvents.Proseify);
    setResponse(event.detail);
  };
  const handleSuggest = (event: CustomEvent) => {
    console.log({ event });
    setActiveMode(GenerationEvents.Suggest);
    setResponse(event.detail);
  };

  useListener(GenerationEvents.Extend, handleExtend);
  useListener(GenerationEvents.Summarize, handleSummarize);
  useListener(GenerationEvents.Critique, handleCritique);
  useListener(GenerationEvents.Proseify, handleProseify);
  useListener(GenerationEvents.Suggest, handleSuggest);

  const [activeMode, setActiveMode] = React.useState<GenerationEvents | null>(null);

  const [response, setResponse] = React.useState<GenerateResponse | null>(null);

  return (
    <div className="">
      <div className="my-2">
        {activeMode === null && "Call Thought Partner to see results here."}
        {activeMode === GenerationEvents.Suggest && "Suggstions"}
        {activeMode === GenerationEvents.Extend && "Extend"}
        {activeMode === GenerationEvents.Summarize && "Summary"}
        {activeMode === GenerationEvents.Critique && "Critique"}
        {activeMode === GenerationEvents.Proseify && "Proseify"}
      </div>

      <div className="flex flex-col gap-5">
        {response?.data.map((data) => (
          <ResponseCard key={data.id} data={data} />
        ))}
      </div>
      {/* <pre className="text-xxs">{JSON.stringify(response, null, 2)}</pre> */}
    </div>
  );
};

interface ResponseCardProps {
  data: GenerateResponse["data"][0];
}

const ResponseCard = ({ data }: ResponseCardProps) => {
  const { plugin } = useObsidianApp();

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <div>
        <textarea
          className="py-1 px-2 prose w-full"
          rows={10}
          ref={textareaRef}
          onBlur={(event: React.FocusEvent<HTMLTextAreaElement>) => {
            // If the value has changed send this as a correction

            if (event.target.value !== data.output) {
              new Notice("Sending this as a correction");
              console.log("Sending correction");
              feedback({
                group: "correction",
                text: event.target.value,
                data_id: data.id,
                user: "obsidian-user",
              });
            }
          }}
          defaultValue={data.output}
        />
        <div className="flex justify-between gap-4 mt-5 ">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(data.output);
              new Notice("Copied to clipboard 📋");
              feedback({
                group: "actions",
                label: "copied",
                data_id: data.id,
                user: "obsidian-user",
              });
            }}
          >
            <ClipboardCopyIcon />
            Copy
          </Button>
          <div className="flex grow justify-end gap-2">
            <Button
              onClick={() => {
                new Notice("Marked as a good generation 👍");
                feedback({
                  group: "vote",
                  label: "upvote",
                  data_id: data.id,
                  user: "obsidian-user",
                });
              }}
            >
              <CheckIcon /> Good
            </Button>
            <Button
              onClick={() => {
                new Notice("Marked as a poor generation 👎");
                feedback({
                  group: "vote",
                  label: "downvote",
                  data_id: data.id,
                  user: "obsidian-user",
                });
              }}
            >
              <Cross1Icon />
              Bad
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  className?: string;
}

const Button = ({ className, ...props }: ButtonProps) => {
  return <button className="flex gap-2 px-3 py-1" {...props} />;
};

export const ReactApp = () => {
  const { app } = useObsidianApp();

  return (
    <main>
      <h4 className="text-2xl leading-loose font-bold">Thought Partner</h4>
      <ResponseArea />
    </main>
  );
};
