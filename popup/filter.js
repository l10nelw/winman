import { hasClass, addClass, removeClass } from '../utils.js';
import { $currentWindowRow, $otherWindowsList, $otherWindowRows, getName, getScrollbarWidth } from './common.js';

export let $shownRows;

export function init() {
    $shownRows = $otherWindowRows;
}

// Show only rows whose names contain str, and sort them by name length, shortest first.
export function execute(str) {
    if (!str) {
        $shownRows = unfilter();
        return;
    }

    $shownRows = filter(str); // Show/hide rows and add _nameLength property to shown rows
    if (!$shownRows.length) return;

    $shownRows.sort(compareNameLength);
    $shownRows.forEach($row => $otherWindowsList.appendChild($row)); // move filtered rows to the end of the list


    // Add offset if scrollbar disappears
    if (hasClass('scrollbarOffset', $currentWindowRow) && !getScrollbarWidth($otherWindowsList)) {
        addClass('scrollbarOffset', $otherWindowsList);
    }
}

const compareNameLength = ($a, $b) => $a._nameLength - $b._nameLength;

// Hide rows whose names do not contain str, case-insensitive.
// The rest are shown, given _nameLength property and returned as an array.
function filter(str) {
    str = str.toUpperCase();
    const $filteredRows = [];
    for (const $row of $otherWindowRows) {
        const name = getName($row).toUpperCase();
        const isMatch = name.includes(str);
        $row.hidden = !isMatch;
        if (isMatch) {
            $row._nameLength = name.length;
            $filteredRows.push($row);
        }
    }
    return $filteredRows;
}

// Reverse all changes made by filter(): hidden rows, sort order, _index, scrollbar offset.
// Restore sort order by comparing 'live' $otherWindowsList.children against correctly-sorted $otherWindowRows.
function unfilter() {
    $otherWindowRows.forEach(($correctRow, index) => {
        $correctRow.hidden = false;
        const $row = $otherWindowsList.children[index];
        if ($row !== $correctRow) {
            $otherWindowsList.insertBefore($correctRow, $row);
        }
    });
    removeClass('scrollbarOffset', $otherWindowsList);
    return $otherWindowRows;
}