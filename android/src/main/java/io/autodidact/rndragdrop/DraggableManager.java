package io.autodidact.rndragdrop;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.Locale;

public class DraggableManager extends DragDropManager {

    private static final String NAME = "DraggableManager";
    private static final int COMMAND_START_DRAGGING = 1;

    final DraggableRegistry registry;

    DraggableManager(ReactApplicationContext context) {
        super();
        registry = new DraggableRegistry(context);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }


    @Override
    @NonNull
    public ReactViewGroup createViewInstance(ThemedReactContext context) {
        Draggable draggable = new Draggable(context);
        registry.registerDraggable(draggable);
        return draggable;
    }

    @Override
    public void onDropViewInstance(@NonNull ReactViewGroup view) {
        super.onDropViewInstance(view);
        registry.unregisterDraggable((Draggable) view);
    }

    @Override
    public void receiveCommand(ReactViewGroup root, int commandId, @Nullable ReadableArray args) {
        switch (commandId) {
            case COMMAND_START_DRAGGING:
                ((Draggable) root).startDragging();
                break;
                default:
                    throw new JSApplicationIllegalArgumentException(String.format(Locale.ENGLISH, "Illegal command id#%d", commandId));
        }
    }
}
