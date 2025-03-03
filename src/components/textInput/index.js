import "./style.css";

export default function CustomTextInput({
  placeholder = "",
  getTextInput,
  type = "text",
  maxLength,
  customStyles = {},
}) {
  return (
    <input
      style={{ ...customStyles }}
      onInput={(e) => getTextInput(e.currentTarget.value)}
      placeholder={placeholder}
      id="Custom-input"
      type={type}
      maxLength={maxLength}
    />
  );
}
