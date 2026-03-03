import * as gmItemService from "./gmItem.service.js";

export const getCharacterItemsController = async (req, res) => {
  const chaNum = Number(req.params.chaNum);
  const invenType = Number(req.query.invenType);

  const result = await gmItemService.getCharacterItems({
    chaNum,
    invenType,
  });

  if (!result.ok) {
    return res.status(400).json(result);
  }

  res.json(result);
};
