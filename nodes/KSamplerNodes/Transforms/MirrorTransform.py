from .transform_functions import mirror_transform


DIRECTIONS = ["vertically", "horizontally", "both", "90 degree rotation", "180 degree rotation"]

class MirrorTransform:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "start_at": ("FLOAT", {"default": 0, "min": 0.0, "max": 1.0, "step": 0.01}),
                "stop_at": ("FLOAT", {"default": 0, "min": 0.0, "max": 1.0, "step": 0.01}),
                "mode": (["replace", "combine"],),
                "direction": (DIRECTIONS, {"default": "horizontally"}),
            }
        }

    RETURN_TYPES = ("TRANSFORM",)
    FUNCTION = "process"

    CATEGORY = "sampling/transforms"

    def process(self,
                start_at=0,
                stop_at=0,
                mode="replace",
                direction="horizontally",):
        return ([{
                "params": {
                    "start_at": start_at,
                    "stop_at": stop_at,
                    "mode": mode,
                    "direction": direction,
                },
                "function": self.func
            }],)

    def func(self, step, x0, total_steps, params) -> list:
        if total_steps * params["start_at"] <= step <= total_steps * params["stop_at"]:
            return mirror_transform(x0, params)
