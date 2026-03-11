interface TalonListHeader {
    type: "header";
    key: string;
    value: string;
}
interface TalonListItem {
    type: "item";
    key: string;
    value?: string;
}
interface EmptyLine {
    type: "empty";
}
interface CommentLine {
    type: "comment";
    text: string;
}
export interface TalonList {
    headers: (TalonListHeader | CommentLine)[];
    items: (TalonListItem | CommentLine | EmptyLine)[];
}
export declare function parseTalonList(text: string): TalonList;
export {};
