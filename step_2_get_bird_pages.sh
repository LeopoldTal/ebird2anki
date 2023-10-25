cut -d$'\t' -f 3 ./step_1_victoria_bird_list.tsv | while read url ; do slug=$(echo $url | sed s#https://ebird.org/species/## | sed s#/## ); wget -O step_2_bird_pages/$slug.html $url ; done
