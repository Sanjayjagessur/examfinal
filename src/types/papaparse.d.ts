declare module 'papaparse' {
  export interface ParseResult<T = any> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  }

  export interface ParseConfig {
    delimiter?: string;
    header?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    complete?: (results: ParseResult) => void;
    error?: (error: ParseError) => void;
    step?: (results: ParseStepResult) => void;
    beforeFirstChunk?: (chunk: string) => string | void;
    chunk?: (results: ParseResult) => void;
    fastMode?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseStepResult) => void;
    complete?: (results: ParseResult) => void;
    error?: (error: ParseError) => void;
    download?: boolean;
    downloadRequestBody?: boolean;
    downloadFields?: boolean;
    downloadMimeType?: string;
    downloadFilename?: string;
    downloadUseIntranetExplorer?: boolean;
    downloadWithCredentials?: boolean;
    downloadMethod?: string;
    downloadHeaders?: any;
    downloadRequestHeaders?: any;
    downloadRequestMethod?: string;
    downloadRequestWithCredentials?: boolean;
    downloadRequestTimeout?: number;
    downloadRequestAsync?: boolean;
    downloadRequestUser?: string;
    downloadRequestPassword?: string;
    downloadRequestOverrideMimeType?: string;
    downloadRequestResponseType?: string;
    downloadRequestOnload?: (xhr: XMLHttpRequest) => void;
    downloadRequestOnerror?: (xhr: XMLHttpRequest) => void;
    downloadRequestOnprogress?: (xhr: XMLHttpRequest) => void;
    downloadRequestOnreadystatechange?: (xhr: XMLHttpRequest) => void;
    downloadRequestOnabort?: (xhr: XMLHttpRequest) => void;
    downloadRequestOnloadstart?: (xhr: XMLHttpRequest) => void;
    downloadRequestOnloadend?: (xhr: XMLHttpRequest) => void;
    downloadRequestOntimeout?: (xhr: XMLHttpRequest) => void;
    downloadRequestOnreadystatechange?: (xhr: XMLHttpRequest) => void;
    downloadRequestOnabort?: (xhr: XMLHttpRequest) => void;
    downloadRequestOnloadstart?: (xhr: XMLHttpRequest) => void;
    downloadRequestOnloadend?: (xhr: XMLHttpRequest) => void;
    downloadRequestOntimeout?: (xhr: XMLHttpRequest) => void;
  }

  export interface ParseStepResult<T = any> {
    data: T;
    errors: ParseError[];
    meta: ParseMeta;
  }

  export function parse<T = any>(input: string | File, config?: ParseConfig): ParseResult<T>;
  export function unparse(data: any[], config?: any): string;
  export function unparse(data: any, config?: any): string;
}

declare const Papa: {
  parse: typeof import('papaparse').parse;
  unparse: typeof import('papaparse').unparse;
};

export default Papa;
