#!/bin/bash

output_file="edited-stories.txt"
root_dir="."

> "$output_file"

find "$root_dir" -type f \( -name "*.stories.js" -o -name "*.stories.ts" -o -name "*.stories.tsx" \) | while read -r file; do
    echo "Processing: $file"

    sed -n "/\.scenario[[:blank:]]*=[[:blank:]]*{/,/}/{
/label[[:blank:]]*[:=][[:blank:]]*/{
    /\"/{
        s/.*label[[:blank:]]*[:=][[:blank:]]*\"\([^\"]*\)\".*/\1/;
        s/'//g;
        s/\//_/g;
        s/ /_/g;
        s/\$/\_/
        s/$/_/;
        p
    }
    /\"/!{
        s/.*label[[:blank:]]*[:=][[:blank:]]*\([^,}]*\).*/\1/;
        s/'//g;
        s/\//_/g;
        s/ /_/g;
        s/$/_/;
        p
    }
}
}" "$file" >> "$output_file"

    sed "/\.scenario[[:blank:]]*=[[:blank:]]*{/,/}/{
/label[[:blank:]]*[:=][[:blank:]]*/d
}" "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done

echo "Label extraction complete. Labels saved in $output_file."
