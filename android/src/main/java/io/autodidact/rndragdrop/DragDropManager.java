package io.autodidact.rndragdrop;

import android.view.DragEvent;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;

import java.util.Map;

public abstract class DragDropManager extends ReactViewManager {

    private static final String PROPS_DATA = "data";
    private static final String PROPS_ENABLED = "enabled";
    private static final String PROPS_TYPES = "types";

    @Override
    public abstract String getName();

    @ReactProp(name = DragDropEvent.EVENT_NAME)
    public void setCallback(DragDropBase view, boolean callback) {
        //view.setShouldDispatchEvent(callback);
    }

    @ReactProp(name = PROPS_DATA)
    public void setData(DragDropBase view, @Nullable ReadableMap data) {
        view.setData(data);
    }

    @ReactProp(name = PROPS_ENABLED)
    public void setEnabled(DragDropBase view, boolean enabled) {

    }

    @ReactProp(name = PROPS_TYPES)
    public void setTypes(DragDropBase view, @Nullable ReadableArray types) {
        view.setType(types);
    }

    @Override
    protected void addEventEmitters(@NonNull final ThemedReactContext reactContext, @NonNull final ReactViewGroup view) {
        final EventDispatcher eventDispatcher = reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher();
        view.setOnDragListener(new View.OnDragListener() {
            @Override
            public boolean onDrag(View v, DragEvent event) {
                eventDispatcher.dispatchEvent(DragDropEvent.obtain(v.getId(), view.getId(), event));
                return true;
            }
        });
    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put(DragDropEvent.EVENT_NAME, MapBuilder.of("registrationName", DragDropEvent.EVENT_NAME))
                .build();
    }
}
