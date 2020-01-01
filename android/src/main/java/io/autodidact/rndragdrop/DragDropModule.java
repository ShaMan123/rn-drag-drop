package io.autodidact.rndragdrop;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class DragDropModule extends ReactContextBaseJavaModule {

    final DraggableRegistry registry;

    public DragDropModule(ReactApplicationContext reactContext) {
        super(reactContext);
        registry = new DraggableRegistry(reactContext);
    }

    @Override
    public String getName() {
        return "DragDrop";
    }

    @ReactMethod
    public void sampleMethod(String stringArgument, int numberArgument, Callback callback) {
        // TODO: Implement some actually useful functionality
        callback.invoke("Received numberArgument: " + numberArgument + " stringArgument: " + stringArgument);
    }
}
