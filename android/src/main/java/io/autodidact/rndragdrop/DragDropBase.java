package io.autodidact.rndragdrop;

import android.annotation.TargetApi;
import android.content.ClipData;
import android.content.ClipDescription;
import android.content.Intent;
import android.graphics.Rect;
import android.graphics.RectF;
import android.os.Build;
import android.view.DragEvent;
import android.view.View;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.views.view.ReactViewGroup;

import java.util.ArrayList;

public class DragDropBase extends ReactViewGroup {

    private static final String RN_DRAG_DROP_MIME_TYPE = "REACT_NATIVE_CLIP_DATA";

    private final ReactContext mContext;
    private final ArrayList<Integer> mDTypes;
    private ReadableMap mData;

    DragDropBase(ReactContext context) {
        super(context);
        mContext = context;
        mDTypes = new ArrayList<>();
    }

    public ArrayList<Integer> getType() {
        return mDTypes;
    }

    public void setType(ReadableArray types) {
        mDTypes.clear();
        if (types != null) {
            for (int i = 0; i < types.size(); i++) {
                mDTypes.add(types.getInt(i));
            }
        }
    }

    public ReadableMap getData() {
        return mData;
    }

    public void setData(ReadableMap data) {
        mData = data;
    }

    public int getReactTag() {
        return getId();
    }

    public RectF getHitRect() {
        Rect out = new Rect();
        getHitRect(out);
        return new RectF(out);
    }

    public boolean intersects(RectF rect) {
        return getHitRect().intersects(rect.left, rect.top, rect.right, rect.bottom);
    }

    static int getFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            return View.DRAG_FLAG_GLOBAL | View.DRAG_FLAG_GLOBAL_URI_READ | View.DRAG_FLAG_GLOBAL_URI_WRITE;
        }
        return 0;
    }

    void startDragging() {
        ClipData data = createClipData();
        DragShadowBuilder shadowBuilder = new DragShadowBuilder(this);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            startDragAndDrop(data, shadowBuilder, null, getFlags());
        } else {
            startDrag(data, shadowBuilder, null, getFlags());
        }
    }

    ClipData createClipData() {
        Intent intent = new Intent(Intent.ACTION_RUN);
        intent.putExtra("ref", getReactTag());
        intent.putExtra("data", mData.toString());
        intent.putIntegerArrayListExtra("types", mDTypes);
        intent.putExtra("source", mContext.getPackageName());
        String[] mimeTypes = new String[2];
        mimeTypes[0] = ClipDescription.MIMETYPE_TEXT_INTENT;
        mimeTypes[1] = RN_DRAG_DROP_MIME_TYPE;
        return new ClipData(RN_DRAG_DROP_MIME_TYPE, mimeTypes, new ClipData.Item(intent));
    }

    boolean isSameType(DragEvent event) {
        if (isDragEvent(event)) {
            ArrayList<Integer> types = event
                    .getClipData()
                    .getItemAt(0)
                    .getIntent()
                    .getIntegerArrayListExtra("types");

            for (int t: types) {
                if (mDTypes.contains(t)) {
                    return true;
                }
            }
        }

        return false;
    }

    static boolean isDragEvent(DragEvent event) {
        return event.getClipDescription().filterMimeTypes(RN_DRAG_DROP_MIME_TYPE).length > 0;
    }
}
