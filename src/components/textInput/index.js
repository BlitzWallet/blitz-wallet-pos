import "./style.css";

export default function CustomTextInput({
  placeholder = "",
  getTextInput,
  type = "text",
  maxLength,
  inputText = "",
  customStyles = {},
}) {
  return (
    <input
      style={{ ...customStyles }}
      onInput={(e) => getTextInput(e.currentTarget.value)}
      value={inputText}
      placeholder={placeholder}
      id="Custom-input"
      type={type}
      maxLength={maxLength}
    />
  );
}
