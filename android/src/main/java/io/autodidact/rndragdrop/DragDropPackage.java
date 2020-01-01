package io.autodidact.rndragdrop;

import androidx.annotation.NonNull;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.bridge.JavaScriptModule;

public class DragDropPackage implements ReactPackage {

    static final String TAG = "RNDragDrop";

    @Override
    @NonNull
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(
                new DragDropModule(reactContext)
        );
    }

    @Override
    @NonNull
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
                new DraggableManager(reactContext),
                new DropZoneManager()
        );
    }
}
