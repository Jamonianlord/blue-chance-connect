const fs = require('fs');
const path = 'src/routes/match.tsx';
let content = fs.readFileSync(path, 'utf8');
const before = content;

content = content.replace(
  /\{searchingCount > 0 \? \(\s*<span className="font-medium">\{searchingCount\}<\/span> \{searchingCount === 1 \? ['"]person['"] : ['"]people['"]\} online now\s*\) : \(\s*['"]Hang tight.*?['"]\s*\)\}/gs,
  `{searchingCount > 0 ? (
            <>
              <span className="font-medium">{searchingCount}</span> {searchingCount === 1 ? "person" : "people"} online now
            </>
          ) : (
            "Hang tight — we're looking for someone online right now who wants to chat."
          )}`
);

if (content === before) {
  console.log('NO MATCH FOUND - nothing replaced');
} else {
  fs.writeFileSync(path, content, 'utf8');
  console.log('Replacement successful, ' + (content.match(/Hang tight/g) || []).length + ' occurrence(s) of "Hang tight" now in file');
}
