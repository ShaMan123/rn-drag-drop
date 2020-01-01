package io.autodidact.rndragdrop;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class Draggable extends DragDropBase implements RCTEventEmitter {

    private final DeviceEventManagerModule.RCTDeviceEventEmitter mEventEmitter;

    //private final UIManagerModule mUIManager;

    Draggable(ReactContext context) {
        super(context);
        UIManagerModule mUIManager = context.getNativeModule(UIManagerModule.class);
        mEventEmitter = context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);
    }



    @Override
    public void receiveEvent(int targetTag, String eventName, @Nullable WritableMap event) {
        if (targetTag == getReactTag() && event != null && event.hasKey("translationX")) {
            startDragging();
        }
    }

    @Override
    public void receiveTouches(String eventName, WritableArray touches, WritableArray changedIndices) {

    }
}
