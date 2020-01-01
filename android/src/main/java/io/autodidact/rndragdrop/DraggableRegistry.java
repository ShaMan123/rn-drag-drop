package io.autodidact.rndragdrop;

import android.util.Log;
import android.util.SparseArray;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcherListener;

public class DraggableRegistry implements EventDispatcherListener {

    private static final String EVENT_NAME_HANDLER_STATE_CHANGE = "onHandlerStateChange";
    private static final String EVENT_NAME_GESTURE_EVENT = "onGestureEvent";

    private final ReactContext mReactContext;
    private final UIManagerModule.CustomEventNamesResolver mCustomEventNamesResolver;

    public DraggableRegistry(ReactContext reactContext) {
        mReactContext = reactContext;
        UIManagerModule mUIManager = mReactContext.getNativeModule(UIManagerModule.class);
        mCustomEventNamesResolver = mUIManager.getDirectEventNamesResolver();
        mUIManager.getEventDispatcher().addListener(this);
    }

    private SparseArray<Draggable> mDraggableRegistry = new SparseArray<>();

    void registerDraggable(Draggable draggable) {
        mDraggableRegistry.put(draggable.getReactTag(), draggable);
    }

    void unregisterDraggable(Draggable draggable) {
        mDraggableRegistry.remove(draggable.getReactTag());
    }

    @Override
    public void onEventDispatch(Event event) {
        Log.d(DragDropPackage.TAG, "onEventDispatch: " + event);
        String eventName = mCustomEventNamesResolver.resolveCustomEventName(event.getEventName());
        if (eventName != null && eventName.equals(EVENT_NAME_HANDLER_STATE_CHANGE) && mDraggableRegistry.indexOfKey(event.getViewTag()) > -1) {
            event.dispatch(mDraggableRegistry.get(event.getViewTag()));
        }
    }
}
