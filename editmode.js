export let active = false;
const $toggler = document.getElementById('editMode');
const $commandInput = document.getElementById('commandInput');
let Port;
let $nameInputs;
let newNames = {};

export function init(port) {
    Port = port;
    Port.onMessage.addListener(handleMessage);
    $toggler.addEventListener('change', toggle);
}

function handleMessage(message) {
    switch (message.response) {
        case 'EditMode.validateName': {
            const status = message.result;
            const windowId = message.windowId;
            const $input = $nameInputs.find($i => $i._id == windowId);
            if (status) {
                showError($input);
            } else {
                markNewName($input);
            }
        }
    }
}

function toggle() {
    active = $toggler.checked;
    if (active) {
        $nameInputs = Array.from(document.querySelectorAll('.windowNameInput'));
        $nameInputs.forEach($i => $i._original = $i.value);
        $nameInputs[0].select();
        document.body.addEventListener('focusout', onInput);
    } else {
        saveNewNames();
        document.body.removeEventListener('focusout', onInput);
    }
    $nameInputs.forEach($i => $i.readOnly = !active);
    $commandInput.disabled = active;
    $commandInput.placeholder = active ? `Edit mode: Enter to save, Esc to cancel` : ``;
    document.body.classList.toggle('editMode', active);
}

function onInput(event) {
    const $input = event.target;
    if (!$input.classList.contains('windowNameInput')) return;

    const name = $input.value;
    $input.value = name.trim();
    resetErrors();

    const $dupes = findDuplicates();
    $dupes.forEach(showError);
    validateName($input);
}

function validateName($input) {
    const name = $input.value;
    if (name) {
        // Check if this name has invalid chars or is a duplicate of any names in metadata
        const windowId = $input._id;
        Port.postMessage({
            request: 'EditMode.validateName',
            windowId,
            module: 'Metadata',
            prop: 'isInvalidName',
            args: [windowId, name],
        });
    } else {
        // Blank: clear this window's givenName
        markNewName($input);
    }
}

function findDuplicates() {
    const $filledInputs = $nameInputs.filter($i => $i.value);
    let $dupes = new Set();
    for (const $input of $filledInputs) {
        const name = $input.value;
        for (const $compare of $filledInputs) {
            if ($compare.value === name && $compare !== $input) {
                $dupes.add($input);
                $dupes.add($compare);
            }
        }
    }
    return Array.from($dupes);
}

function showError($input) {
    $input.classList.add('inputError');
    $toggler.disabled = true;
}

function resetErrors() {
    $nameInputs.forEach($i => $i.classList.remove('inputError'));
    $toggler.disabled = false;
}

function markNewName($input) {
    const name = $input.value;
    if (name !== $input._original) {
        newNames[$input._id] = name;
    }
}

function saveNewNames() {
    Port.postMessage({
        command: true,
        module: 'Metadata',
        prop: 'saveNewNames',
        args: [newNames, true],
    });
}