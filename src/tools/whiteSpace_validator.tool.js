export default function whiteSpaceValidator(word) {
    var re = /^[^\s]+$/;
    return re.test(String(word).toLowerCase());
}