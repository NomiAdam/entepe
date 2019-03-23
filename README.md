# bachelor-ui

> Experimental utility library that makes working with Usenet server possible in Node.JS environment.
> Made as a part of authors Bachelor Lunews project.

* RFC 3977 compliant
* Uses MIME decoding and encoding
* Typed with TypeScript

[![NPM](https://img.shields.io/npm/v/entepe.svg)](https://www.npmjs.com/package/entepe) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save entepe
```

## Usage

```jsx
import NNTP, { IMessageInfo } from 'entepe'

const options = {
    host: usenet.HOST.IP.address,
    port: usenet.HOST.port,
};

const connection: NNTP = new NNTP(options);

await connection.connect();
const remoteArticle: IMessageInfo = await connection.getArticleHead('<globalId.usenet.org>');
await connection.quit();
```

## License

MIT © [NomiAdam](https://github.com/NomiAdam)
