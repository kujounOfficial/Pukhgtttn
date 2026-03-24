let logMessages = [];
let isLogVisible = false;

function getClassLoader() {
    const classLoader = {
        Gravity: Java.use("android.view.Gravity"),
        TextView: Java.use("android.widget.TextView"),
        LinearLayout: Java.use("android.widget.LinearLayout"),
        ViewGroup_LayoutParams: Java.use("android.view.ViewGroup$LayoutParams"),
        LinearLayout_LayoutParams: Java.use("android.widget.LinearLayout$LayoutParams"),
        Color: Java.use("android.graphics.Color"),
        ActivityThread: Java.use("android.app.ActivityThread"),
        ActivityThread_ActivityClientRecord: Java.use("android.app.ActivityThread$ActivityClientRecord"),
        View_OnTouchListener: Java.use("android.view.View$OnTouchListener"),
        MotionEvent: Java.use("android.view.MotionEvent"),
        String: Java.use("java.lang.String"),
        ScrollView: Java.use("android.widget.ScrollView"),
        View_OnClickListener: Java.use("android.view.View$OnClickListener"),
        SeekBar: Java.use("android.widget.SeekBar"),
        Button: Java.use("android.widget.Button"),
        EditText: Java.use("android.widget.EditText"),
        InputType: Java.use("android.text.InputType")
    };
    return classLoader;
}

function pixelDensityToPixels(context, dp) {
    const density = context.getResources().getDisplayMetrics().density.value;
    return parseInt(dp * density);
}

function getMainActivity(classLoader) {
    const activityThread = classLoader.ActivityThread.sCurrentActivityThread.value;
    const mActivities = activityThread.mActivities.value;
    const activityClientRecord = Java.cast(mActivities.valueAt(0), classLoader.ActivityThread_ActivityClientRecord);
    return activityClientRecord.activity.value;
}

class Menu {
    #classLoader;
    #activity;
    #MATCH_PARENT;
    #mainLayout;
    #menuStart;
    #menuLayout;
    #menuBarLayout;
    #menuBarTitle;
    #menuScroll;
    #menuOptions;
    #options;
    #contentView;
    #WRAP_CONTENT;
    #menuScrollLayout;
    #menuScrollView;
    #colorOn;
    #colorOff;
    #logLayout;
    #logScrollView;
    #logTextView;
    #logInputLayout;
    #logInput;
    #logButton;

    constructor(classLoader, activity) {
        this.#classLoader = classLoader;
        this.#activity = activity;
        this.#MATCH_PARENT = classLoader.LinearLayout_LayoutParams.MATCH_PARENT.value;
        this.#WRAP_CONTENT = classLoader.LinearLayout_LayoutParams.WRAP_CONTENT.value;
        this.#options = {};
        this.#createContentView();
        this.#createMainLayout();
        this.#createMenuScroll();
    }

    #createContentView() {
        this.#contentView = this.#classLoader.LinearLayout.$new(this.#activity);
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#MATCH_PARENT);
        this.#contentView.setLayoutParams(layoutParams);
        this.#contentView.setGravity(this.#classLoader.Gravity.CENTER.value);
        this.#contentView.setBackgroundColor(this.#classLoader.Color.TRANSPARENT.value);
    }

    #createMainLayout() {
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#WRAP_CONTENT, this.#WRAP_CONTENT);
        this.#mainLayout = this.#classLoader.LinearLayout.$new(this.#activity);
        this.#mainLayout.setLayoutParams(layoutParams);
    }

    #createMenuScroll() {
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        this.#menuScrollView = this.#classLoader.ScrollView.$new(this.#activity);
        const padding = pixelDensityToPixels(this.#activity, 8);
        this.#menuScrollView.setLayoutParams(layoutParams);
        this.#menuScrollView.setPadding(padding, padding, padding, padding);
        this.#menuScrollView.mFillViewport.value = true;
    }

    #createMenuScrollLayout() {
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        this.#menuScrollLayout = this.#classLoader.LinearLayout.$new(this.#activity);
        this.#menuScrollLayout.setLayoutParams(layoutParams);
        this.#menuScrollLayout.setOrientation(this.#menuScrollLayout.VERTICAL.value);
    }

    createMenuOptionsLayout(colorOn, colorOff) {
        this.#createMenuScroll();
        this.#createMenuScrollLayout();
        this.#colorOn = colorOn;
        this.#colorOff = colorOff;
    }

    createMenuStart(title, size, color) {
        size = pixelDensityToPixels(this.#activity, size);
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#WRAP_CONTENT, this.#WRAP_CONTENT);
        this.#menuStart = this.#classLoader.TextView.$new(this.#activity);
        this.#menuStart.setLayoutParams(layoutParams);
        this.#menuStart.setText(this.#classLoader.String.$new(title));
        this.#menuStart.setTextSize(size);
        this.#menuStart.setTextColor(this.#classLoader.Color.parseColor(color));
    }

    createMenuLayout(color, size) {
        const SIZE_DP = pixelDensityToPixels(this.#activity, size);
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(SIZE_DP, SIZE_DP);
        this.#menuLayout = this.#classLoader.LinearLayout.$new(this.#activity);
        this.#menuLayout.setLayoutParams(layoutParams);
        this.#menuLayout.setBackgroundColor(this.#classLoader.Color.parseColor(color));
        this.#menuLayout.setOrientation(this.#menuLayout.VERTICAL.value);
    }

    createMenuBarLayout(color) {
        const padding = pixelDensityToPixels(this.#activity, 10);
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        this.#menuBarLayout = this.#classLoader.LinearLayout.$new(this.#activity);
        this.#menuBarLayout.setLayoutParams(layoutParams);
        this.#menuBarLayout.setBackgroundColor(this.#classLoader.Color.parseColor(color));
        this.#menuBarLayout.setPadding(padding, padding, 0, padding);
    }

    createMenuBarTitle(title, color) {
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#WRAP_CONTENT, this.#WRAP_CONTENT);
        this.#menuBarTitle = this.#classLoader.TextView.$new(this.#activity);
        this.#menuBarTitle.setLayoutParams(layoutParams);
        this.#menuBarTitle.setText(this.#classLoader.String.$new(title));
        this.#menuBarTitle.setTextColor(this.#classLoader.Color.parseColor(color));
    }

    #drawContentView() {
        this.#activity.addContentView(this.#contentView, this.#contentView.getLayoutParams());
    }

    #drawMainLayout() {
        this.#contentView.addView(this.#mainLayout);
    }

    #drawMenuStart() {
        this.#mainLayout.addView(this.#menuStart);
    }

    #drawMenuLayout() {
        this.#mainLayout.addView(this.#menuLayout);
    }

    #drawMenuBarLayout() {
        this.#menuLayout.addView(this.#menuBarLayout);
    }

    #drawMenuBarTitle() {
        this.#menuBarLayout.addView(this.#menuBarTitle);
    }

    #drawMenuOptions() {
        this.#menuLayout.addView(this.#menuScrollView);
        this.#menuScrollView.addView(this.#menuScrollLayout);
    }

    #createOptionClickEvent(id, optionView, callbacks) {
        const classLoader = this.#classLoader;
        let optionState = false;
        const colorOn = this.#colorOn;
        const colorOff = this.#colorOff;
        const optionOnClickListener = Java.registerClass({
            name: "com.example.OptionClickListener" + id,
            implements: [classLoader.View_OnClickListener],
            methods: {
                onClick(p1) {
                    if (!optionState) {
                        p1.setBackgroundColor(classLoader.Color.parseColor(colorOn));
                        optionState = true;
                        callbacks.on();
                    } else {
                        p1.setBackgroundColor(classLoader.Color.parseColor(colorOff));
                        optionState = false;
                        callbacks.off();
                    }
                }
            }
        });
        optionView.setOnClickListener(optionOnClickListener.$new());
    }

    addOption(id, name, callbacks) {
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        const padding = pixelDensityToPixels(this.#activity, 5);
        const option = this.#classLoader.TextView.$new(this.#activity);
        const margin = pixelDensityToPixels(this.#activity, 10);
        option.setText(this.#classLoader.String.$new(name));
        option.setBackgroundColor(this.#classLoader.Color.parseColor(this.#colorOff));
        option.setTextColor(this.#classLoader.Color.parseColor("#75757B"));
        layoutParams.setMargins(0, 0, 0, margin);
        option.setLayoutParams(layoutParams);
        option.setPadding(padding, padding, 0, padding);
        this.#menuScrollLayout.addView(option);
        this.#createOptionClickEvent(id, option, callbacks);
    }

    clearOptions() {
        while (this.#menuScrollLayout.getChildCount() > 0) {
            this.#menuScrollLayout.removeViewAt(0);
        }
    }

    addText(text, textSize, textColor) {
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#WRAP_CONTENT, this.#WRAP_CONTENT);
        const margin = pixelDensityToPixels(this.#activity, 5);
        const textView = this.#classLoader.TextView.$new(this.#activity);
        textView.setText(this.#classLoader.String.$new(text));
        textView.setTextSize(textSize);
        textView.setTextColor(this.#classLoader.Color.parseColor(textColor));
        layoutParams.setMargins(0, 0, 0, margin);
        textView.setLayoutParams(layoutParams);
        this.#menuScrollLayout.addView(textView);
    }

    addSeekBar(textValue, initialValue, minValue, maxValue, callback) {
        const layoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        const margin = pixelDensityToPixels(this.#activity, 1);
        const seekBar = this.#classLoader.SeekBar.$new(this.#activity, null, 0, Java.use("android.R$style").Widget_Holo_SeekBar.value);
        const textView = this.#classLoader.TextView.$new(this.#activity);
        seekBar.setMax(maxValue - minValue);
        seekBar.setProgress(0);
        layoutParams.setMargins(0, 0, 0, margin);
        seekBar.setLayoutParams(layoutParams);
        const text = Java.use("java.lang.String").$new(textValue + " " + initialValue);
        textView.setText(text);
        textView.setTextColor(this.#classLoader.Color.parseColor("#75757B"));
        seekBar.setProgress(initialValue);

        const SeekBarChangeListener = Java.use("android.widget.SeekBar$OnSeekBarChangeListener");
        const SeekBarChangeListenerImplementation = Java.registerClass({
            name: "com.example.SeekBarChangeListener" + Math.floor(Math.random() * 1000),
            implements: [SeekBarChangeListener],
            methods: {
                onProgressChanged(seekBar, progress, fromUser) {
                    const value = progress + minValue;
                    const text = Java.use("java.lang.String").$new(textValue + " " + value);
                    textView.setText(text);
                    callback(value, "move");
                },
                onStartTrackingTouch(seekBar) {
                    const progress = seekBar.getProgress();
                    const value = progress + minValue;
                    const text = Java.use("java.lang.String").$new(textValue + " " + value);
                    textView.setText(text);
                    callback(value, "start");
                },
                onStopTrackingTouch(seekBar) {
                    const progress = seekBar.getProgress();
                    const value = progress + minValue;
                    const text = Java.use("java.lang.String").$new(textValue + " " + value);
                    textView.setText(text);
                    callback(value, "end");
                }
            }
        });

        seekBar.setOnSeekBarChangeListener(SeekBarChangeListenerImplementation.$new());
        this.#menuScrollLayout.addView(textView);
        this.#menuScrollLayout.addView(seekBar);
        textView.setLayoutParams(layoutParams);
        textView.setGravity(this.#classLoader.Gravity.CENTER.value);
    }

    createLogWindow() {
        this.#logLayout = this.#classLoader.LinearLayout.$new(this.#activity);
        const logLayoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        this.#logLayout.setLayoutParams(logLayoutParams);
        this.#logLayout.setOrientation(this.#logLayout.VERTICAL.value);
        this.#logLayout.setBackgroundColor(this.#classLoader.Color.parseColor("#222222"));

        const logTitle = this.#classLoader.TextView.$new(this.#activity);
        const logTitleParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        logTitle.setLayoutParams(logTitleParams);
        logTitle.setText(this.#classLoader.String.$new("Log Output"));
        logTitle.setTextColor(this.#classLoader.Color.parseColor("#FFFFFF"));
        logTitle.setTextSize(14);
        logTitle.setPadding(
            pixelDensityToPixels(this.#activity, 5), pixelDensityToPixels(this.#activity, 5),
            pixelDensityToPixels(this.#activity, 5), pixelDensityToPixels(this.#activity, 5)
        );
        logTitle.setGravity(this.#classLoader.Gravity.CENTER.value);
        this.#logLayout.addView(logTitle);

        this.#logScrollView = this.#classLoader.ScrollView.$new(this.#activity);
        const logScrollParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, pixelDensityToPixels(this.#activity, 150));
        this.#logScrollView.setLayoutParams(logScrollParams);
        this.#logScrollView.setBackgroundColor(this.#classLoader.Color.parseColor("#111111"));

        this.#logTextView = this.#classLoader.TextView.$new(this.#activity);
        const logTextParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        this.#logTextView.setLayoutParams(logTextParams);
        this.#logTextView.setTextColor(this.#classLoader.Color.parseColor("#AAFFAA"));
        this.#logTextView.setTextSize(12);
        this.#logTextView.setPadding(
            pixelDensityToPixels(this.#activity, 5), pixelDensityToPixels(this.#activity, 5),
            pixelDensityToPixels(this.#activity, 5), pixelDensityToPixels(this.#activity, 5)
        );

        this.#logScrollView.addView(this.#logTextView);
        this.#logLayout.addView(this.#logScrollView);

        const scrollButtonLayout = this.#classLoader.LinearLayout.$new(this.#activity);
        const scrollButtonLayoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        scrollButtonLayout.setLayoutParams(scrollButtonLayoutParams);
        scrollButtonLayout.setOrientation(this.#classLoader.LinearLayout.HORIZONTAL.value);

        const scrollUpButton = this.#classLoader.Button.$new(this.#activity);
        const scrollUpButtonParams = this.#classLoader.LinearLayout_LayoutParams.$new(0, this.#WRAP_CONTENT, 0.5);
        scrollUpButton.setLayoutParams(scrollUpButtonParams);
        scrollUpButton.setText(this.#classLoader.String.$new("Up"));
        scrollUpButton.setTextColor(this.#classLoader.Color.parseColor("#FFFFFF"));
        scrollUpButton.setBackgroundColor(this.#classLoader.Color.parseColor("#444444"));

        const scrollDownButton = this.#classLoader.Button.$new(this.#activity);
        const scrollDownButtonParams = this.#classLoader.LinearLayout_LayoutParams.$new(0, this.#WRAP_CONTENT, 0.5);
        scrollDownButton.setLayoutParams(scrollDownButtonParams);
        scrollDownButton.setText(this.#classLoader.String.$new("Down"));
        scrollDownButton.setTextColor(this.#classLoader.Color.parseColor("#FFFFFF"));
        scrollDownButton.setBackgroundColor(this.#classLoader.Color.parseColor("#444444"));

        const that = this;

        const scrollUpClickListener = Java.registerClass({
            name: "com.example.ScrollUpClickListener" + Math.floor(Math.random() * 1000),
            implements: [this.#classLoader.View_OnClickListener],
            methods: {
                onClick(p1) {
                    Java.scheduleOnMainThread(() => {
                        if (that.#logScrollView) that.#logScrollView.scrollBy(0, -50);
                    });
                }
            }
        });
        scrollUpButton.setOnClickListener(scrollUpClickListener.$new());

        const scrollDownClickListener = Java.registerClass({
            name: "com.example.ScrollDownClickListener" + Math.floor(Math.random() * 1000),
            implements: [this.#classLoader.View_OnClickListener],
            methods: {
                onClick(p1) {
                    Java.scheduleOnMainThread(() => {
                        if (that.#logScrollView) that.#logScrollView.scrollBy(0, 50);
                    });
                }
            }
        });
        scrollDownButton.setOnClickListener(scrollDownClickListener.$new());

        scrollButtonLayout.addView(scrollUpButton);
        scrollButtonLayout.addView(scrollDownButton);
        this.#logLayout.addView(scrollButtonLayout);

        this.#logInputLayout = this.#classLoader.LinearLayout.$new(this.#activity);
        const inputLayoutParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        this.#logInputLayout.setLayoutParams(inputLayoutParams);
        this.#logInputLayout.setOrientation(this.#classLoader.LinearLayout.HORIZONTAL.value);

        this.#logInput = this.#classLoader.EditText.$new(this.#activity);
        const logInputParams = this.#classLoader.LinearLayout_LayoutParams.$new(0, this.#WRAP_CONTENT, 0.7);
        this.#logInput.setLayoutParams(logInputParams);
        this.#logInput.setHint(this.#classLoader.String.$new("Input log..."));
        this.#logInput.setTextColor(this.#classLoader.Color.parseColor("#FFFFFF"));
        this.#logInput.setHintTextColor(this.#classLoader.Color.parseColor("#888888"));
        this.#logInput.setInputType(this.#classLoader.InputType.TYPE_CLASS_TEXT.value);

        this.#logButton = this.#classLoader.Button.$new(this.#activity);
        const logButtonParams = this.#classLoader.LinearLayout_LayoutParams.$new(0, this.#WRAP_CONTENT, 0.3);
        this.#logButton.setLayoutParams(logButtonParams);
        this.#logButton.setText(this.#classLoader.String.$new("Log"));
        this.#logButton.setTextColor(this.#classLoader.Color.parseColor("#FFFFFF"));
        this.#logButton.setBackgroundColor(this.#classLoader.Color.parseColor("#444444"));

        const logButtonClickListener = Java.registerClass({
            name: "com.example.LogButtonClickListener" + Math.floor(Math.random() * 1000),
            implements: [this.#classLoader.View_OnClickListener],
            methods: {
                onClick(p1) {
                    const logText = that.#logInput.getText().toString();
                    if (logText && logText.length > 0) {
                        that.addLogMessage(logText);
                        that.#logInput.setText(that.#classLoader.String.$new(""));
                    }
                }
            }
        });
        this.#logButton.setOnClickListener(logButtonClickListener.$new());

        this.#logInputLayout.addView(this.#logInput);
        this.#logInputLayout.addView(this.#logButton);
        this.#logLayout.addView(this.#logInputLayout);

        this.#menuScrollLayout.addView(this.#logLayout);
        this.updateLogView();
    }

    addLogMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        logMessages.push(`[${timestamp}] ${message}`);
        if (logMessages.length > 6) logMessages.shift();
        this.updateLogView();
    }

    updateLogView() {
        if (this.#logTextView) {
            this.#logTextView.setText(this.#classLoader.String.$new(logMessages.join('\n')));
            Java.scheduleOnMainThread(() => {
                if (this.#logScrollView) this.#logScrollView.fullScroll(0x00000082);
            });
        }
    }

    addLogToggleButton() {
        const toggleButtonParams = this.#classLoader.LinearLayout_LayoutParams.$new(this.#MATCH_PARENT, this.#WRAP_CONTENT);
        const margin = pixelDensityToPixels(this.#activity, 10);
        toggleButtonParams.setMargins(0, 0, 0, margin);

        const toggleButton = this.#classLoader.TextView.$new(this.#activity);
        toggleButton.setText(this.#classLoader.String.$new("Show/Hide Log"));
        toggleButton.setBackgroundColor(this.#classLoader.Color.parseColor("#444444"));
        toggleButton.setTextColor(this.#classLoader.Color.parseColor("#FFFFFF"));
        toggleButton.setLayoutParams(toggleButtonParams);
        toggleButton.setPadding(
            pixelDensityToPixels(this.#activity, 5), pixelDensityToPixels(this.#activity, 10),
            pixelDensityToPixels(this.#activity, 5), pixelDensityToPixels(this.#activity, 10)
        );
        toggleButton.setGravity(this.#classLoader.Gravity.CENTER.value);

        const that = this;
        const toggleLogClickListener = Java.registerClass({
            name: "com.example.ToggleLogClickListener" + Math.floor(Math.random() * 1000),
            implements: [this.#classLoader.View_OnClickListener],
            methods: {
                onClick(p1) {
                    if (isLogVisible) {
                        that.#logLayout.setVisibility(0x8);
                        isLogVisible = false;
                    } else {
                        that.#logLayout.setVisibility(0x0);
                        isLogVisible = true;
                        that.updateLogView();
                    }
                }
            }
        });
        toggleButton.setOnClickListener(toggleLogClickListener.$new());
        this.#menuScrollLayout.addView(toggleButton);
    }

    #createMainLayoutEvent() {
        const mainLayout = this.#mainLayout;
        const menuLayout = this.#menuLayout;
        const menuStart = this.#menuStart;
        const classLoader = this.#classLoader;
        let initialX = 0;
        let initialY = 0;
        let isMove = false;
        let isMenuLayout = false;
        let initialTouchTime = 0;

        const MainLayoutOnTouchListener = Java.registerClass({
            name: "com.example.MainLayoutEvent",
            implements: [classLoader.View_OnTouchListener],
            methods: {
                onTouch(view, event) {
                    switch (event.getAction()) {
                        case classLoader.MotionEvent.ACTION_DOWN.value:
                            initialX = view.getX() - event.getRawX();
                            initialY = view.getY() - event.getRawY();
                            isMove = false;
                            initialTouchTime = Date.now();
                            break;
                        case classLoader.MotionEvent.ACTION_UP.value:
                            if (!isMove) {
                                if (!isMenuLayout) {
                                    mainLayout.removeView(menuStart);
                                    mainLayout.addView(menuLayout);
                                    isMenuLayout = true;
                                } else {
                                    mainLayout.removeView(menuLayout);
                                    mainLayout.addView(menuStart);
                                    isMenuLayout = false;
                                }
                            }
                            break;
                        case classLoader.MotionEvent.ACTION_MOVE.value:
                            view.setX(event.getRawX() + initialX);
                            view.setY(event.getRawY() + initialY);
                            if (Date.now() - initialTouchTime > 200) isMove = true;
                            break;
                        default:
                            return false;
                    }
                    return true;
                }
            }
        });
        this.#mainLayout.setOnTouchListener(MainLayoutOnTouchListener.$new());
    }

    start() {
        this.#drawContentView();
        this.#drawMainLayout();
        this.#drawMenuStart();
        this.#drawMenuBarLayout();
        this.#drawMenuBarTitle();
        this.#drawMenuOptions();
        this.#createMainLayoutEvent();
    }
}

let globalMenu = null;

function main() {
    Java.perform(function () {
        Java.scheduleOnMainThread(function () {
            const classLoader = getClassLoader();
            const mainActivity = getMainActivity(classLoader);
            const menu = new Menu(classLoader, mainActivity);
            globalMenu = menu;

            menu.createMenuStart("K-Menu", 15, "#006400");
            menu.createMenuLayout("#18122B", 300);
            menu.createMenuBarLayout("#635985");
            menu.createMenuBarTitle("K-Menu", "#FFC107");
            menu.createMenuOptionsLayout("#443C68", "#393053");

            menu.addLogToggleButton();
            menu.createLogWindow();

            // Sem přidej vlastní položky, např.:
            // menu.addOption("moje_volba", "Moje Volba", {
            //     on: () => { /* zapnout */ },
            //     off: () => { /* vypnout */ }
            // });
            // menu.addText("Info text", 12, "#FFFFFF");
            // menu.addSeekBar("Hodnota:", 50, 0, 100, (val, phase) => { /* callback */ });

            menu.start();
        });
    });
}

setTimeout(main, 10000);
