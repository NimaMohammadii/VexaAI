(() => {
  const rootElement = document.getElementById("voiceSelectorRoot");
  if (!rootElement || !window.React || !window.ReactDOM) {
    return;
  }

  const { useEffect, useRef, useState } = React;
  const voices = [
    { name: "Rachel", icon: "🎧" },
    { name: "Maya", icon: "🎧" },
    { name: "Arman", icon: "🎧" },
    { name: "Noah", icon: "🎧" },
  ];
  const defaultVoice = rootElement.dataset.defaultVoice || voices[0].name;

  const VoiceSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState(defaultVoice);
    const menuRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
      window.VEXA_SELECTED_VOICE = selectedVoice;
      window.dispatchEvent(
        new CustomEvent("vexa:voice-change", {
          detail: { voice: selectedVoice },
        })
      );
    }, [selectedVoice]);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const handleOutside = (event) => {
        const target = event.target;
        if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
          return;
        }
        setIsOpen(false);
      };

      document.addEventListener("click", handleOutside);
      document.addEventListener("touchstart", handleOutside);
      return () => {
        document.removeEventListener("click", handleOutside);
        document.removeEventListener("touchstart", handleOutside);
      };
    }, [isOpen]);

    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    const handleSelect = (voice) => {
      setSelectedVoice(voice);
      setIsOpen(false);
    };

    const selectedVoiceData = voices.find((voice) => voice.name === selectedVoice) || voices[0];

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "button",
        {
          className: "voice-trigger",
          type: "button",
          "aria-haspopup": "listbox",
          "aria-expanded": isOpen,
          onClick: handleToggle,
          ref: triggerRef,
        },
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "span",
            { className: "voice-avatar", "aria-hidden": "true" },
            selectedVoiceData.icon
          ),
          React.createElement("span", null, selectedVoice)
        )
      ),
      isOpen
        ? React.createElement(
            "div",
            {
              className: "voice-menu",
              role: "listbox",
              "aria-label": "Select a voice",
              ref: menuRef,
            },
            voices.map((voice) =>
              React.createElement(
                "button",
                {
                  key: voice.name,
                  className: `voice-option${selectedVoice === voice.name ? " is-active" : ""}`,
                  type: "button",
                  role: "option",
                  onClick: () => handleSelect(voice.name),
                },
                React.createElement("span", { className: "voice-avatar", "aria-hidden": "true" }, voice.icon),
                React.createElement("span", null, voice.name)
              )
            )
          )
        : null
    );
  };

  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(VoiceSelector));
})();
