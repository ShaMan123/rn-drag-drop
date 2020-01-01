package io.autodidact.rndragdrop;

import android.view.DragEvent;

import androidx.core.util.Pools;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class DragDropEvent extends Event<DragDropEvent> {

    private static final int TOUCH_EVENTS_POOL_SIZE = 7; // magic

    private static final Pools.SynchronizedPool<DragDropEvent> EVENTS_POOL =
            new Pools.SynchronizedPool<>(TOUCH_EVENTS_POOL_SIZE);

    static final String EVENT_NAME = "onDragStateChange";

    private static int extractState(DragEvent event) {
        /*
        switch (event.getAction()) {
            case DragEvent.ACTION_DRAG_STARTED:
                return DragEvent.ACTION_DRAG_STARTED;
            case DragEvent.ACTION_DRAG_LOCATION:
                return DragEvent.ACTION_DRAG_STARTED;
            case DragEvent.ACTION_DROP:
                return DragEvent.ACTION_DRAG_STARTED;
            case DragEvent.ACTION_DRAG_ENDED:
                return DragEvent.ACTION_DRAG_STARTED;
            case DragEvent.ACTION_DRAG_ENTERED:
                return DragEvent.ACTION_DRAG_STARTED;
            case DragEvent.ACTION_DRAG_EXITED:
                return DragEvent.ACTION_DRAG_STARTED;
        }

         */
        return 1;
    }

    public static DragDropEvent obtain(int sourceTag, int targetTag, DragEvent event) {
        WritableNativeMap eventData = new WritableNativeMap();
        eventData.putInt("state", extractState(event));
        eventData.putInt("source", sourceTag);
        eventData.putInt("target", targetTag);
        //event.getClipData().getItemAt(0).getIntent().get
        return obtain(sourceTag, EVENT_NAME, eventData);
    }

    private static DragDropEvent obtain(int viewTag, String eventName, WritableMap eventData) {
        DragDropEvent event = EVENTS_POOL.acquire();
        if (event == null) {
            event = new DragDropEvent();
        }
        event.init(viewTag, eventName, eventData);
        return event;
    }

    private WritableMap mExtraData;
    private String mEventName;

    private DragDropEvent() {
    }

    protected void init(int viewTag, String eventName, WritableMap eventData) {
        super.init(viewTag);
        mEventName = eventName;
        mExtraData = eventData;
    }

    @Override
    public void onDispose() {
        mExtraData = null;
        EVENTS_POOL.release(this);
    }

    @Override
    public String getEventName() {
        return mEventName;
    }

    @Override
    public boolean canCoalesce() {
        // TODO: coalescing
        return false;
    }

    @Override
    public short getCoalescingKey() {
        // TODO: coalescing
        return 0;
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(getViewTag(), mEventName, mExtraData);
    }
}
