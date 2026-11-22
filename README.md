# Unit Test Naming Helper

Suggest clean, consistent unit test names from a plain description of the behavior under test. A practical naming utility for developers who want readable `describe`/`it` blocks without bikeshedding.

**Live:** [unit-test-naming-helper.itsjust.tools](https://unit-test-naming-helper.itsjust.tools)

## Features

- Describe the behavior once and get names in five conventions: `should`, `when/then`, `given`, BDD (`describe`/`it`) and ARR (`test_…_given_…`)
- Convention selector with a live preview of **all** conventions at once
- Batch mode: paste one behavior per line and generate names for all of them
- Export generated names as Jest or Vitest `describe`/`it` snippets with arrange/act/assert scaffolding
- Copy-to-clipboard for the suggested name and the exported snippet (`Y` / toolbar button)
- History of recent generations, capped at 20 entries, newest first
- Validation warnings for empty, vague, overly long or verb-less descriptions
- Shareable state via URL, `.itsjust.json` import/export and image/PDF export
- 100% client-side — no data ever leaves your browser

## Naming conventions

| Convention | Example output                                                        |
| ---------- | --------------------------------------------------------------------- |
| should     | `should loads the user profile`                                       |
| when/then  | `when the user clicks save, then the draft is stored`                 |
| given      | `given the id is missing, throws an error`                            |
| BDD        | `describe('when the user clicks save')` / `it('the draft is stored')` |
| ARR        | `test_throws_an_error_given_the_id_is_missing`                        |

## Keyboard shortcuts

| Key | Action               |
| --- | -------------------- |
| `G` | Focus behavior input |
| `Y` | Copy current name    |

## Development

```bash
npm install
npm run build -w @itsjust/core   # build shared core first
npm run dev
npm test
```

## Deployment

```bash
docker build -t itsjust-unit-test-naming-helper .
docker run -p 3000:3000 itsjust-unit-test-naming-helper
```

The production image runs the Next.js standalone server and listens at `http://127.0.0.1:$PORT`.

## License

MIT
