cut -d$'\t' -f 3 ./victoria_bird_list.tsv | while read url ; do slug=$(echo $url | sed s#https://ebird.org/species/## | sed s#/## ); wget -O bird_pages/$slug.html $url ; done
